import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { ProfileService } from "@/lib/services/profile.service";
import { logger } from "@/lib/logger";

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.boolean(),
});

const buildDisplayName = (email: string) => {
  const [name] = email.split("@");
  return name?.trim() || null;
};

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: result.error.format() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!result.data.acceptTerms) {
    return new Response(JSON.stringify({ error: "Akceptacja regulaminu jest wymagana." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = data.user?.id;
  if (userId) {
    const profileService = new ProfileService(supabase);
    try {
      await profileService.upsertProfile(userId, {
        diet_id: null,
        allergen_ids: [],
        dislike_ids: [],
        display_name: buildDisplayName(result.data.email),
        accept_terms: true,
      });
    } catch (profileError) {
      logger.error("Error creating profile on register:", profileError);
    }
  }

  return new Response(
    JSON.stringify({
      user: {
        id: data.user?.id ?? null,
        email: data.user?.email ?? null,
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
