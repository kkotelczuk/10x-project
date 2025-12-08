import type { SupabaseClient } from "@/db/supabase.client";
import type { RecipeDetailsDTO, DbInsert } from "@/types";

export class RecipeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves a single recipe by its UUID.
   * Checks RLS policies implicitly via the supabase client instance.
   *
   * @param id - The UUID of the recipe
   * @returns RecipeDetailsDTO if found, null otherwise
   */
  async getRecipeById(id: string): Promise<RecipeDetailsDTO | null> {
    const { data, error } = await this.supabase.from("recipes").select("*").eq("id", id).single();

    if (error) {
      // PGRST116 is the code for "JSON object requested, multiple (or no) rows returned"
      // When using .single(), this means no row was found.
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Deletes a recipe by its UUID.
   * Checks RLS policies implicitly via the supabase client instance.
   *
   * @param id - The UUID of the recipe to delete
   * @returns true if deleted, false if not found (or not owned by user)
   */
  async deleteRecipe(id: string): Promise<boolean> {
    const { error, count } = await this.supabase.from("recipes").delete({ count: "exact" }).eq("id", id);

    if (error) {
      throw error;
    }

    // count is null if no rows matched or if count option wasn't used
    return count !== null && count > 0;
  }

  /**
   * Checks if the user has reached the daily generation limit.
   * @param userId - The UUID of the user
   * @throws Error if limit is reached
   */
  async checkDailyLimit(userId: string): Promise<void> {
    const { remaining } = await this.getDailyUsage(userId);
    if (remaining <= 0) {
      throw new Error("Daily generation limit reached");
    }
  }

  /**
   * Gets the daily usage for a user.
   * @param userId - The UUID of the user
   * @returns Object containing remaining and limit
   */
  async getDailyUsage(userId: string): Promise<{ remaining: number; limit: number }> {
    const limit = 3;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from("generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (error) {
      throw error;
    }

    const used = count || 0;
    return {
      remaining: Math.max(0, limit - used),
      limit,
    };
  }

  /**
   * Logs a recipe generation attempt.
   * @param userId - The UUID of the user
   * @param success - Whether the generation was successful
   * @param errorMessage - Optional error message
   */
  async logGenerationAttempt(userId: string, success: boolean, errorMessage?: string): Promise<void> {
    const { error } = await this.supabase.from("generation_logs").insert({
      user_id: userId,
      success,
      error_message: errorMessage,
    });

    if (error) {
      console.error("Failed to log generation attempt:", error);
    }
  }

  /**
   * Creates a new recipe from generated data.
   * @param userId - The UUID of the user
   * @param data - The recipe data to insert
   * @returns The created RecipeDetailsDTO
   */
  async createGeneratedRecipe(
    userId: string,
    data: Omit<DbInsert<"recipes">, "id" | "user_id" | "created_at">
  ): Promise<RecipeDetailsDTO> {
    const recipeInsert: DbInsert<"recipes"> = {
      ...data,
      user_id: userId,
    };

    const { data: newRecipe, error } = await this.supabase.from("recipes").insert(recipeInsert).select("*").single();

    if (error) {
      throw error;
    }

    return newRecipe;
  }
}
