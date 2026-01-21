import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeService } from "@/lib/services/recipe.service";
import { ProfileService } from "@/lib/services/profile.service";
import { OpenRouterService, OpenRouterServiceError } from "@/lib/services/OpenRouterService";
import { logger } from "@/lib/logger";
import type { GenerateRecipeCommand, GenerateRecipeResponse } from "@/types";
import type { Json } from "@/db/database.types";

export const prerender = false;

const generateRecipeSchema = z.object({
  original_text: z.string().min(3).max(1000),
});

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // Initialize Services
  const openRouterService = new OpenRouterService({ logger });
  const recipeService = new RecipeService(supabase, openRouterService);
  const profileService = new ProfileService(supabase);

  try {
    // 2. Input Validation
    const body = await context.request.json();
    const result = generateRecipeSchema.safeParse(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: result.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command: GenerateRecipeCommand = result.data;

    // 3. Check Daily Limit
    // This throws if limit reached
    await recipeService.checkDailyLimit(userId);

    // 4. Fetch Profile for Personalization
    const profile = await profileService.getProfile(userId);

    // 5. Generate Recipe via AI
    const generatedData = await recipeService.generateRecipe(command.original_text, profile);

    // 6. Save Recipe
    // Map GeneratedRecipeData to DbInsert<"recipes"> fields
    // Note: 'ingredients' and 'instructions' are JSON types in DB
    const newRecipe = await recipeService.createGeneratedRecipe(userId, {
      title: generatedData.title,
      ingredients: generatedData.ingredients as unknown as Json,
      instructions: generatedData.instructions as unknown as Json,
      prep_time_minutes: generatedData.prep_time_minutes,
      calories: generatedData.calories,
      diet_label: generatedData.diet_label,
      is_active: true,
    });

    // 7. Log Success
    await recipeService.logGenerationAttempt(userId, true);

    // 8. Get Updated Usage
    const usage = await recipeService.getDailyUsage(userId);

    // 9. Return Response
    const responseBody: GenerateRecipeResponse = {
      recipe: {
        id: newRecipe.id,
        title: newRecipe.title,
        ingredients: newRecipe.ingredients as unknown as GenerateRecipeResponse["recipe"]["ingredients"],
        instructions: newRecipe.instructions as unknown as GenerateRecipeResponse["recipe"]["instructions"],
      },
      usage,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Error Handling
    logger.error("Generate Recipe API Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failure
    await recipeService.logGenerationAttempt(userId, false, errorMessage);

    if (error instanceof OpenRouterServiceError) {
      return new Response(JSON.stringify({ error: "Failed to generate recipe from AI provider" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (errorMessage === "Daily generation limit reached") {
      return new Response(JSON.stringify({ error: "Daily generation limit reached" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (errorMessage.includes("JSON") || errorMessage.includes("Invalid JSON structure")) {
      return new Response(JSON.stringify({ error: "Failed to generate recipe from AI provider" }), {
        status: 502, // Bad Gateway or 422 Unprocessable Entity
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
