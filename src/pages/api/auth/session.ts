import type { APIRoute } from "astro";

import { ProfileService } from "@/lib/services/profile.service";
import { logger } from "@/lib/logger";

export const prerender = false;

const buildDisplayName = (email?: string | null) => {
  if (!email) return null;
  const [name] = email.split("@");
  return name?.trim() || null;
};

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ isAuthenticated: false, user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const profileService = new ProfileService(locals.supabase);
    const profile = await profileService.getProfile(user.id);

    return new Response(
      JSON.stringify({
        isAuthenticated: true,
        user: {
          displayName: profile?.display_name ?? buildDisplayName(user.email),
          avatarUrl: null,
        },
        profileComplete: Boolean(profile?.diet_id),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Error in GET /api/auth/session:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
