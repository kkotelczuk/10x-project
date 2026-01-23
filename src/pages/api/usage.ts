import type { APIRoute } from "astro";
import { RecipeService } from "@/lib/services/recipe.service";
import { logger } from "@/lib/logger";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  try {
    const recipeService = new RecipeService(locals.supabase);
    const usage = await recipeService.getDailyUsage(userId);

    return new Response(JSON.stringify(usage), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error in GET /api/usage:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
