import type { SupabaseClient } from "@/db/supabase.client";
import type { AllergenDTO } from "@/types";

export class AllergenService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all allergens from the database.
   * @returns A promise that resolves to an array of AllergenDTO objects.
   * @throws Error if the database query fails.
   */
  async getAllAllergens(): Promise<AllergenDTO[]> {
    const { data, error } = await this.supabase.from("allergens").select("*");

    if (error) {
      throw error;
    }

    return data || [];
  }
}

