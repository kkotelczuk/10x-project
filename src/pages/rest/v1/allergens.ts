import type { APIRoute } from "astro";
import { AllergenService } from "@/lib/services/allergen.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const service = new AllergenService(locals.supabase);
    const allergens = await service.getAllAllergens();

    return new Response(JSON.stringify(allergens), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching allergens:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
