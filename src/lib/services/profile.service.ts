import type { SupabaseClient } from "@/db/supabase.client";
import type { ProfileDTO, UpsertProfileCommand } from "@/types";
import { logger } from "@/lib/logger";

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves the full profile for a user, including aggregated allergens and dislikes.
   * @param userId The UUID of the user.
   * @returns ProfileDTO or null if not found.
   */
  async getProfile(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select(
        `
        id,
        display_name,
        diet_id,
        terms_accepted_at,
        created_at,
        profile_allergens (
          allergen_id
        ),
        profile_dislikes (
          ingredient_id
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // PostgREST error for no rows returned (single() failed)
        return null;
      }
      logger.error("Error fetching profile:", error);
      throw new Error("Database error fetching profile");
    }

    if (!data) {
      return null;
    }

    // Transform nested relations into flat string arrays
    const allergens = (data.profile_allergens as unknown as { allergen_id: string }[]).map((a) => a.allergen_id);

    const dislikes = (data.profile_dislikes as unknown as { ingredient_id: string }[]).map((d) => d.ingredient_id);

    return {
      id: data.id,
      display_name: data.display_name,
      diet_id: data.diet_id,
      terms_accepted_at: data.terms_accepted_at,
      created_at: data.created_at,
      allergens,
      dislikes,
    };
  }

  /**
   * Upserts a user profile and updates related many-to-many relationships.
   * Handles validation for terms acceptance on new profiles.
   * @param userId The UUID of the user.
   * @param command The data to update.
   * @returns The updated ProfileDTO.
   */
  async upsertProfile(userId: string, command: UpsertProfileCommand): Promise<ProfileDTO> {
    // 1. Check existing profile to determine if it's a new user or update
    const existingProfile = await this.getProfile(userId);
    const isNewUser = !existingProfile;

    // 2. Validate terms acceptance for new users
    if (isNewUser && !command.accept_terms) {
      throw new Error("Terms acceptance is required for new profiles.");
    }

    // Determine timestamps
    const now = new Date().toISOString();
    let termsAcceptedAt = existingProfile?.terms_accepted_at;
    if (isNewUser) {
      termsAcceptedAt = now;
    } else {
      // We need to preserve existing privacy_accepted_at if we don't have it in existingProfile DTO
      // Ideally we should fetch it, but getProfile doesn't return it.
      // Let's assume for update we don't need to touch it unless it's an upsert on the same ID.
      // Actually, upsert in Supabase updates columns if ID exists.
      // If we don't include it in the update payload, it shouldn't change existing value if we use ignoreDuplicates? No.
      // Upsert syntax: .upsert({ ... }) replaces the row or inserts.
      // If we leave out a column in upsert, and it's an UPDATE, does it keep old value?
      // Supabase upsert performs an INSERT ... ON CONFLICT DO UPDATE.
      // If we provide all fields, it updates them.
      // Wait, getProfile returns ProfileDTO which DOES NOT have privacy_accepted_at.
      // I need to be careful not to overwrite privacy_accepted_at with null or something if I can't read it.
      // However, I can just NOT include it in the object if I want to keep it?
      // But for INSERT (new user) it is required.
      // Strategy: We can query the raw profile first to get privacy_accepted_at if it exists.
    }

    // To be safe regarding the 'privacy_accepted_at' which is required in DB but missing in DTO:
    // I will fetch the raw profile row if it exists to get that field.
    let rawProfileData = null;
    if (!isNewUser) {
      const { data } = await this.supabase.from("profiles").select("privacy_accepted_at").eq("id", userId).single();
      rawProfileData = data;
    }

    const privacyVal = isNewUser ? now : rawProfileData?.privacy_accepted_at || now;
    const termsVal = termsAcceptedAt || now; // Fallback if somehow null on existing

    // 3. Update main profile table
    const profileData = {
      id: userId,
      diet_id: command.diet_id,
      display_name: command.display_name,
      terms_accepted_at: termsVal,
      privacy_accepted_at: privacyVal,
      updated_at: now,
      // created_at is handled by default in DB or we can leave it (it's nullable in Insert, but usually set by default)
    };

    const { error: profileError } = await this.supabase.from("profiles").upsert(profileData);

    if (profileError) {
      logger.error("Error upserting profile:", profileError);
      throw new Error(`Database error upserting profile: ${profileError.message}`);
    }

    // 4. Update Relations (Delete All + Insert New)
    // Allergens
    const { error: clearAllergensError } = await this.supabase
      .from("profile_allergens")
      .delete()
      .eq("profile_id", userId);

    if (clearAllergensError) {
      throw new Error(`Error clearing allergens: ${clearAllergensError.message}`);
    }

    if (command.allergen_ids && command.allergen_ids.length > 0) {
      const { error: insertAllergensError } = await this.supabase.from("profile_allergens").insert(
        command.allergen_ids.map((id) => ({
          profile_id: userId,
          allergen_id: id,
        }))
      );
      if (insertAllergensError) {
        throw new Error(`Error inserting allergens: ${insertAllergensError.message}`);
      }
    }

    // Dislikes
    const { error: clearDislikesError } = await this.supabase
      .from("profile_dislikes")
      .delete()
      .eq("profile_id", userId);

    if (clearDislikesError) {
      throw new Error(`Error clearing dislikes: ${clearDislikesError.message}`);
    }

    if (command.dislike_ids && command.dislike_ids.length > 0) {
      const { error: insertDislikesError } = await this.supabase.from("profile_dislikes").insert(
        command.dislike_ids.map((id) => ({
          profile_id: userId,
          ingredient_id: id,
        }))
      );
      if (insertDislikesError) {
        throw new Error(`Error inserting dislikes: ${insertDislikesError.message}`);
      }
    }

    // 5. Return updated profile
    const updatedProfile = await this.getProfile(userId);
    if (!updatedProfile) {
      throw new Error("Failed to retrieve updated profile");
    }

    return updatedProfile;
  }
}
