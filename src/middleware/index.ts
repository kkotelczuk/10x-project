import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { ProfileService } from "@/lib/services/profile.service";

const PUBLIC_PATHS = ["/", "/login", "/register", "/reset-password"];
const AUTH_PAGES = ["/login", "/register", "/reset-password"];
const PUBLIC_PREFIXES = ["/api/auth", "/_astro"];

const isPublicRequest = (pathname: string) => {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return pathname.includes(".");
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, cookies, redirect } = context;
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  context.locals.supabase = supabase;
  context.locals.user = null;
  context.locals.session = null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user ?? null;

  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    context.locals.session = session ?? null;
  }

  if (AUTH_PAGES.includes(url.pathname) && user) {
    try {
      const profileService = new ProfileService(supabase);
      const profile = await profileService.getProfile(user.id);
      if (!profile || !profile.diet_id) {
        return redirect("/onboarding");
      }
    } catch {
      return redirect("/dashboard");
    }
    return redirect("/dashboard");
  }

  if (!user && !isPublicRequest(url.pathname)) {
    const nextPath = `${url.pathname}${url.search}`;
    return redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return next();
});
