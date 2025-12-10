import type { APIRoute } from "astro";
import { z } from "zod";
import { ProfileService } from "@/lib/services/profile.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import type { UpsertProfileCommand } from "@/types";

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

  // 2. Execute Logic
  const service = new ProfileService(locals.supabase);

  try {
    const profile = await service.getProfile(userId);

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

const upsertProfileSchema = z.object({
  diet_id: z.string().nullable(),
  allergen_ids: z.array(z.string()),
  dislike_ids: z.array(z.string()),
  display_name: z.string().nullable().optional(),
  accept_terms: z.boolean().optional(),
});

export const PUT: APIRoute = async ({ request, locals }) => {
  // 1. Auth Verification (Mocked)
  // Middleware handles token verification and sets locals.user
  // const user = locals.user;
  const userId = DEFAULT_USER_ID;

  // if (!user) {
  //   return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing token" }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }

  // 2. Parse Body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Validate Input
  const result = upsertProfileSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: result.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 4. Execute Logic
  const service = new ProfileService(locals.supabase);

  const command: UpsertProfileCommand = {
    diet_id: result.data.diet_id,
    allergen_ids: result.data.allergen_ids,
    dislike_ids: result.data.dislike_ids,
    display_name: result.data.display_name,
    accept_terms: result.data.accept_terms,
  };

  try {
    const updatedProfile = await service.upsertProfile(userId, command);

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Handle specific business logic errors
    if (errorMessage.includes("Terms acceptance")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
