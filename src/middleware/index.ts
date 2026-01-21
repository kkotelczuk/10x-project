import { defineMiddleware } from "astro:middleware";

import { createSupabaseClient, supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const supabase = token ? createSupabaseClient(token) : supabaseClient;

  context.locals.supabase = supabase;
  context.locals.user = null;

  if (token) {
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    context.locals.user = user;
  }

  return next();
});
