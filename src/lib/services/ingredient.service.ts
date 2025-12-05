import type { SupabaseClient } from "@/db/supabase.client";
import type { IngredientDTO } from "@/types";

export class IngredientService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Searches for ingredients based on a query string.
   * Only returns visible ingredients.
   * Searches both name and variants array.
   *
   * @param query - Optional search string to filter by name or variants (case-insensitive)
   * @param limit - Max number of results (default 50)
   * @returns Array of IngredientDTO
   */
  async searchIngredients(query?: string | null, limit = 50): Promise<IngredientDTO[]> {
    // Strategy: Fetch all visible ingredients and filter in memory.
    // Why: Ingredients are reference data (small dataset, < 1000 items).
    // PostgREST/Supabase filter syntax for partial match in text[] arrays (`variants`)
    // combined with OR logic and casting (`variants::text`) is complex and error-prone
    // due to parser limitations in the JS client.
    // In-memory filtering is robust, simple, and sufficiently performant for this use case.

    const { data, error } = await this.supabase
      .from("ingredients")
      .select("id, name, category, variants")
      .eq("is_visible", true);

    if (error) {
      console.error("Error searching ingredients:", error);
      throw error;
    }

    let results = data || [];

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((item) => {
        // Match name
        if (item.name.toLowerCase().includes(lowerQuery)) return true;
        // Match variants
        if (item.variants && Array.isArray(item.variants)) {
          return item.variants.some((v: string) => v.toLowerCase().includes(lowerQuery));
        }
        return false;
      });
    }

    // Apply limit manually
    return results.slice(0, limit);
  }
}
