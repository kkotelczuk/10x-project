import type { APIRoute } from "astro";
import { RecipeService } from "@/lib/services/recipe.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { logger } from "@/lib/logger";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  // 1. Auth Verification (Mocked)
  // const user = locals.user;
  const userId = DEFAULT_USER_ID;

  // if (!user) {
  //   return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing token" }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }

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
