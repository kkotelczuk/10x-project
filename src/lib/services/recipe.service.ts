import type { SupabaseClient } from "@/db/supabase.client";
import type { DbInsert, ProfileDTO, RecipeDetailsDTO, RecipeIngredientJson, RecipeInstructionJson } from "@/types";
import { OpenRouterService } from "@/lib/services/OpenRouterService";
import { logger } from "@/lib/logger";
import { z } from "zod";

interface GeneratedRecipeData {
  title: string;
  ingredients: RecipeIngredientJson[];
  instructions: RecipeInstructionJson[];
  prep_time_minutes: number;
  calories: number;
  diet_label: string;
}

interface RawRecipeData {
  title?: unknown;
  ingredients?: unknown;
  instructions?: unknown;
  prep_time_minutes?: unknown;
  calories?: unknown;
  diet_label?: unknown;
}

interface RawIngredient {
  item?: unknown;
  amount?: unknown;
  unit?: unknown;
}

interface RawInstruction {
  step?: unknown;
  text?: unknown;
}

const generatedRecipeSchema = z.object({
  title: z.string().min(1).max(100),
  ingredients: z
    .array(
      z.object({
        item: z.string().min(1),
        amount: z.number().nonnegative(),
        unit: z.string().optional(),
      })
    )
    .min(1),
  instructions: z
    .array(
      z.object({
        step: z.number().int().nonnegative(),
        text: z.string().min(1),
      })
    )
    .min(1),
  prep_time_minutes: z.number().int().nonnegative(),
  calories: z.number().int().nonnegative(),
  diet_label: z.string().min(1),
});

export class RecipeService {
  constructor(
    private supabase: SupabaseClient,
    private openRouterService?: OpenRouterService
  ) {}

  /**
   * Retrieves a single recipe by its UUID.
   * Checks RLS policies implicitly via the supabase client instance.
   *
   * @param id - The UUID of the recipe
   * @returns RecipeDetailsDTO if found, null otherwise
   */
  async getRecipeById(id: string): Promise<RecipeDetailsDTO | null> {
    const { data, error } = await this.supabase.from("recipes").select("*").eq("id", id).single();

    if (error) {
      // PGRST116 is the code for "JSON object requested, multiple (or no) rows returned"
      // When using .single(), this means no row was found.
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Deletes a recipe by its UUID.
   * Checks RLS policies implicitly via the supabase client instance.
   *
   * @param id - The UUID of the recipe to delete
   * @returns true if deleted, false if not found (or not owned by user)
   */
  async deleteRecipe(id: string): Promise<boolean> {
    const { error, count } = await this.supabase.from("recipes").delete({ count: "exact" }).eq("id", id);

    if (error) {
      throw error;
    }

    // count is null if no rows matched or if count option wasn't used
    return count !== null && count > 0;
  }

  /**
   * Checks if the user has reached the daily generation limit.
   * @param userId - The UUID of the user
   * @throws Error if limit is reached
   */
  async checkDailyLimit(userId: string): Promise<void> {
    const { remaining } = await this.getDailyUsage(userId);
    if (remaining <= 0) {
      throw new Error("Daily generation limit reached");
    }
  }

  /**
   * Gets the daily usage for a user.
   * @param userId - The UUID of the user
   * @returns Object containing remaining and limit
   */
  async getDailyUsage(userId: string): Promise<{ remaining: number; limit: number }> {
    // In development, return unlimited usage
    if (!import.meta.env.PROD) {
      return {
        remaining: 999,
        limit: 999,
      };
    }

    const limit = 3;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from("generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (error) {
      throw error;
    }

    const used = count || 0;
    return {
      remaining: Math.max(0, limit - used),
      limit,
    };
  }

  /**
   * Logs a recipe generation attempt.
   * @param userId - The UUID of the user
   * @param success - Whether the generation was successful
   * @param errorMessage - Optional error message
   */
  async logGenerationAttempt(userId: string, success: boolean, errorMessage?: string): Promise<void> {
    const { error } = await this.supabase.from("generation_logs").insert({
      user_id: userId,
      success,
      error_message: errorMessage,
    });

    if (error) {
      logger.error("Failed to log generation attempt:", error);
    }
  }

  /**
   * Generates a recipe using the OpenRouter service and user profile data.
   * @param originalText - The recipe request or dish name
   * @param profile - Optional profile data for personalization
   */
  async generateRecipe(originalText: string, profile: ProfileDTO | null): Promise<GeneratedRecipeData> {
    if (!this.openRouterService) {
      throw new Error("OpenRouter service is not configured");
    }

    const systemPrompt = this.buildSystemPrompt(profile);
    const schemaObject = this.buildRecipeSchema();

    const response = await this.openRouterService.createStructuredResponse({
      schemaName: "recipe_generation",
      schemaObject,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Modify the recipe based on the user's preferences and recipe request: ${originalText}`,
        },
      ],
    });

    return this.validateAndSanitize(response);
  }

  /**
   * Creates a new recipe from generated data.
   * @param userId - The UUID of the user
   * @param data - The recipe data to insert
   * @returns The created RecipeDetailsDTO
   */
  async createGeneratedRecipe(
    userId: string,
    data: Omit<DbInsert<"recipes">, "id" | "user_id" | "created_at">
  ): Promise<RecipeDetailsDTO> {
    const recipeInsert: DbInsert<"recipes"> = {
      ...data,
      user_id: userId,
    };

    const { data: newRecipe, error } = await this.supabase.from("recipes").insert(recipeInsert).select("*").single();

    if (error) {
      throw error;
    }

    return newRecipe;
  }

  private buildSystemPrompt(profile: ProfileDTO | null): string {
    let dietConstraints = "";
    if (profile) {
      if (profile.diet_id) {
        dietConstraints += `\n- Follow the ${profile.diet_id} diet rules.`;
      }
      if (profile.allergens && profile.allergens.length > 0) {
        dietConstraints += `\n- STRICTLY EXCLUDE these allergens: ${profile.allergens.join(", ")}.`;
      }
      if (profile.dislikes && profile.dislikes.length > 0) {
        dietConstraints += `\n- Avoid these ingredients if possible: ${profile.dislikes.join(", ")}.`;
      }
    }

    return `You are a professional chef and nutritionist.
Your goal is to generate a structured recipe JSON based on the user's request.

IMPORTANT: Detect the language of the user's input request and generate the recipe content (title, ingredients items, instructions text) in the SAME language.

Constraints:${dietConstraints}

Output strictly valid JSON with the following structure:
{
  "title": "string",
  "ingredients": [{ "item": "string", "amount": number, "unit": "string" }],
  "instructions": [{ "step": number, "text": "string" }],
  "prep_time_minutes": number,
  "calories": number,
  "diet_label": "string"
}

- "amount" should be a number. If it's "to taste", use 0.
- "calories" should be an estimated total number for the recipe (integer).
- "diet_label" should be one of: Balanced, Low-Carb, Low-Fat, High-Protein, Vegan, Vegetarian.
`;
  }

  private buildRecipeSchema(): Record<string, unknown> {
    return {
      type: "object",
      additionalProperties: false,
      required: ["title", "ingredients", "instructions", "prep_time_minutes", "calories", "diet_label"],
      properties: {
        title: { type: "string" },
        ingredients: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["item", "amount", "unit"],
            properties: {
              item: { type: "string" },
              amount: { type: "number" },
              unit: { type: "string" },
            },
          },
        },
        instructions: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["step", "text"],
            properties: {
              step: { type: "number" },
              text: { type: "string" },
            },
          },
        },
        prep_time_minutes: { type: "number" },
        calories: { type: "number" },
        diet_label: { type: "string" },
      },
    };
  }

  private validateAndSanitize(data: unknown): GeneratedRecipeData {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid JSON structure from AI: Data is not an object");
    }

    const raw = data as RawRecipeData;

    if (typeof raw.title !== "string" || !Array.isArray(raw.ingredients) || !Array.isArray(raw.instructions)) {
      throw new Error("Invalid JSON structure from AI: Missing required fields");
    }

    const normalized: GeneratedRecipeData = {
      title: raw.title.substring(0, 100),
      ingredients: raw.ingredients.map((ing: unknown) => {
        const i = ing as RawIngredient;
        return {
          item: String(i?.item || "").trim(),
          amount: Number(i?.amount) || 0,
          unit: String(i?.unit || "").trim(),
        };
      }),
      instructions: raw.instructions.map((inst: unknown) => {
        const i = inst as RawInstruction;
        return {
          step: Number(i?.step || 0),
          text: String(i?.text || "").trim(),
        };
      }),
      prep_time_minutes: Number(raw.prep_time_minutes) || 15,
      calories: Number(raw.calories) || 0,
      diet_label: String(raw.diet_label || "Balanced").trim(),
    };

    const validationResult = generatedRecipeSchema.safeParse(normalized);
    if (!validationResult.success) {
      throw new Error("Invalid JSON structure from AI: Schema validation failed");
    }

    return validationResult.data;
  }
}
