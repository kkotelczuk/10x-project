export const prerender = false;

import type { APIRoute } from "astro";
import { IngredientService } from "@/lib/services/ingredient.service";
import { logger } from "@/lib/logger";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const idParam = url.searchParams.get("id");

    // Parse limit if provided, default to 50, cap at 100 for safety
    const limitParam = url.searchParams.get("limit");
    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 100);
      }
    }

    if (idParam) {
      const ids: string[] = [];
      if (idParam.startsWith("in.(") && idParam.endsWith(")")) {
        const inside = idParam.slice(3, -1);
        ids.push(
          ...inside
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        );
      } else {
        ids.push(idParam);
      }

      if (ids.length === 0) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      }

      const { data, error } = await locals.supabase
        .from("ingredients")
        .select("id, name, category, variants")
        .in("id", ids);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify(data ?? []), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const service = new IngredientService(locals.supabase);
    const ingredients = await service.searchIngredients(query, limit);

    return new Response(JSON.stringify(ingredients), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache for 1 hour if no query, shorter if searching
        "Cache-Control": query ? "public, max-age=60" : "public, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("Error in GET /rest/v1/ingredients:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
