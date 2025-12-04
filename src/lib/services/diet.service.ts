import type { SupabaseClient } from "@/db/supabase.client";
import type { DietDTO } from "../../types";

export class DietService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Retrieves all available diets from the database.
   * returns A list of DietDTO objects.
   * throws Error if the database query fails.
   */
  async getAllDiets(): Promise<DietDTO[]> {
    const { data, error } = await this.supabase.from("diets").select("*");

    if (error) {
      console.error("Error fetching diets:", error);
      throw new Error("Failed to fetch diets");
    }

    return data || [];
  }
}
