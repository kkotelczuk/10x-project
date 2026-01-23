import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

const updatePasswordSchema = z.object({
  password: z.string().min(8),
});

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

  const result = updatePasswordSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: result.error.format() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
  const { error } = await supabase.auth.updateUser({ password: result.data.password });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "updated" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
