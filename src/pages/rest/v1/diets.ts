import type { APIRoute } from "astro";
import { DietService } from "@/lib/services/diet.service";
import { logger } from "@/lib/logger";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const dietService = new DietService(locals.supabase);
    const diets = await dietService.getAllDiets();

    return new Response(JSON.stringify(diets), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("Error in GET /rest/v1/diets:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
