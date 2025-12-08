import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeService } from "@/lib/services/recipe.service";

export const prerender = false;

// Validation schema for the UUID
const idSchema = z.string().uuid();

export const GET: APIRoute = async ({ request, locals }) => {
  // 1. Security & Context Check
  // Ensure we have a supabase client (user is authenticated/session exists)
  // Logic depends on middleware, but generally locals.supabase indicates an active context.
  if (!locals.supabase) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Parse Query Parameters
    const url = new URL(request.url);
    const rawId = url.searchParams.get("id");

    if (!rawId) {
      return new Response(JSON.stringify({ error: "Missing 'id' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle PostgREST specific syntax "eq.{uuid}"
    const id = rawId.startsWith("eq.") ? rawId.slice(3) : rawId;

    // 3. Validation
    const validationResult = idSchema.safeParse(id);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Service Call
    const recipeService = new RecipeService(locals.supabase);
    const recipe = await recipeService.getRecipeById(id);

    // 5. Handle Not Found
    if (!recipe) {
      return new Response(JSON.stringify({ error: "Recipe not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return Success Response
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Private data, do not cache persistently
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching recipe details:", error);

    // 7. Handle System Errors
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  // 1. Security & Context Check
  if (!locals.supabase) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if user is logged in
  const {
    data: { user },
    error: userError,
  } = await locals.supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Parse Query Parameters
    const url = new URL(request.url);
    const rawId = url.searchParams.get("id");

    if (!rawId) {
      return new Response(JSON.stringify({ error: "Missing 'id' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle PostgREST specific syntax "eq.{uuid}"
    const id = rawId.startsWith("eq.") ? rawId.slice(3) : rawId;

    // 3. Validation
    const validationResult = idSchema.safeParse(id);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Service Call
    const recipeService = new RecipeService(locals.supabase);
    const deleted = await recipeService.deleteRecipe(id);

    // 5. Handle Not Found
    if (!deleted) {
      return new Response(JSON.stringify({ error: "Recipe not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return Success Response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);

    // 7. Handle System Errors
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
