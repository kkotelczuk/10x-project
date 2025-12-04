import type { Database } from "@/db/database.types";

// ==========================================
// Base Database Helpers
// ==========================================

/**
 * Helper to access the Table definitions directly from the generated Supabase types.
 */
type Tables = Database["public"]["Tables"];

/**
 * Helper to extract the 'Row' type (the shape of a selected record) for a given table.
 */
export type DbRow<T extends keyof Tables> = Tables[T]["Row"];
export type DbInsert<T extends keyof Tables> = Tables[T]["Insert"];
export type DbUpdate<T extends keyof Tables> = Tables[T]["Update"];

// ==========================================
// 1. Lookups (Reference Data)
// ==========================================

/**
 * DTO for Diet reference data.
 * Directly maps to the 'diets' table row.
 */
export type DietDTO = DbRow<"diets">;

/**
 * DTO for Allergen reference data.
 * Directly maps to the 'allergens' table row.
 */
export type AllergenDTO = DbRow<"allergens">;

/**
 * DTO for Ingredient search results (used for dislikes).
 * Maps to 'ingredients' table, selecting specific fields relevant for the UI search.
 */
export type IngredientDTO = Pick<DbRow<"ingredients">, "id" | "name" | "category" | "variants">;

// ==========================================
// 2. User Profile (Custom Logic)
// ==========================================

/**
 * DTO for the full User Profile response.
 * Combines the base 'profiles' table data with aggregated arrays for relations
 * (allergens and dislikes) which are many-to-many relationships in the DB.
 */
export type ProfileDTO = Pick<
  DbRow<"profiles">,
  "id" | "display_name" | "diet_id" | "terms_accepted_at" | "created_at"
> & {
  /** List of allergen IDs (slugs) associated with the profile */
  allergens: string[];
  /** List of ingredient IDs (slugs) marked as dislikes */
  dislikes: string[];
};

/**
 * Command Model for updating or creating a User Profile.
 * Used in the PUT /api/profile endpoint.
 * Corresponds to an atomic update of 'profiles', 'profile_allergens', and 'profile_dislikes'.
 */
export interface UpsertProfileCommand {
  /** The selected diet ID (FK to diets table) */
  diet_id: string | null;
  /** Array of allergen IDs to associate with the user */
  allergen_ids: string[];
  /** Array of ingredient IDs the user dislikes */
  dislike_ids: string[];
  /** Optional display name update */
  display_name?: string | null;
  /**
   * Required flag when creating a profile for the first time.
   * Maps to setting 'terms_accepted_at' timestamp in the database.
   */
  accept_terms?: boolean;
}

// ==========================================
// 3. Recipe Management
// ==========================================

/**
 * Lightweight DTO for listing recipes in the dashboard.
 * Selects only essential fields to optimize payload size.
 */
export type RecipeListItemDTO = Pick<
  DbRow<"recipes">,
  "id" | "title" | "diet_label" | "created_at" | "is_active" | "prep_time_minutes"
>;

/**
 * Detailed DTO for a single recipe.
 * Extends the database row definition.
 * Note: 'ingredients' and 'instructions' are typed as Json in Supabase types,
 * but in practice, they follow specific structures defined below.
 */
export type RecipeDetailsDTO = DbRow<"recipes">;

// -- JSON Structure Helpers for Recipes --

/** Structure for an item within the 'ingredients' JSONB array */
export interface RecipeIngredientJson {
  item: string;
  amount?: string | number;
  unit?: string;
}

/** Structure for an item within the 'instructions' JSONB array */
export interface RecipeInstructionJson {
  step: number;
  text: string;
}

// ==========================================
// 4. AI Generation
// ==========================================

/**
 * Command Model for requesting a recipe generation/modification.
 * Used in POST /api/generate.
 */
export interface GenerateRecipeCommand {
  /** The original text of the recipe to be modified */
  original_text: string;
}

/**
 * DTO for the successful response of a generation request.
 * Contains the newly created recipe data and usage quota information.
 */
export interface GenerateRecipeResponse {
  /** The generated recipe details */
  recipe: {
    id: string;
    title: string;
    /** Although DB type is Json, the API returns the structured array */
    ingredients: RecipeIngredientJson[];
    instructions: RecipeInstructionJson[];
  };
  /** API Usage quota information */
  usage: {
    /** Number of generations remaining for the period */
    remaining: number;
    /** Total limit for the period */
    limit: number;
  };
}
