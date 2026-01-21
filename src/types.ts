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
// 2.1. Profile View Models
// ==========================================

export type OnboardingMode = "create" | "edit";

export interface OnboardingPrefill {
  display_name: string | null;
  diet_id: string | null;
  allergen_ids: string[];
  dislike_ids: string[];
}

// ==========================================
// 2.2. Auth View Models
// ==========================================

export type AuthFormMode = "login" | "register";

export interface AuthFormState {
  email: string;
  password: string;
  termsAccepted: boolean;
}

export interface AuthFormErrors {
  email?: string;
  password?: string;
  termsAccepted?: string;
  form?: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "słabe" | "średnie" | "mocne";
  requirements: {
    minLength: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export interface NavUserViewModel {
  displayName: string | null;
  avatarUrl?: string | null;
}

export interface UsageQuotaViewModel {
  remaining: number;
  limit: number;
  isLimitReached: boolean;
}

export interface ResetPasswordState {
  email: string;
  status: "idle" | "success" | "error";
}

export interface AuthError {
  code?: string;
  message: string;
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

// ==========================================
// 3.1. Dashboard View Models
// ==========================================

/**
 * Filters state for the dashboard view.
 */
export interface DashboardFiltersState {
  search: string;
  diet: string | "all";
  sort: "created_at.desc" | "created_at.asc";
}

/**
 * Minimal user context needed for the dashboard.
 */
export interface UserDashboardContext {
  displayName: string | null;
  currentDietId: string | null;
}

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

// ==========================================
// 5. OpenRouter (AI Chat Integration)
// ==========================================

export type OpenRouterRole = "system" | "user" | "assistant" | "tool";

export interface OpenRouterMessage {
  role: OpenRouterRole;
  content: string;
  name?: string;
}

export interface OpenRouterParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterResponseFormatJsonSchema {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

export interface OpenRouterChatCompletionInput {
  messages: OpenRouterMessage[];
  model?: string;
  params?: OpenRouterParams;
  response_format?: OpenRouterResponseFormatJsonSchema;
  stream?: boolean;
}

export interface OpenRouterStructuredResponseInput {
  messages: OpenRouterMessage[];
  schemaName: string;
  schemaObject: Record<string, unknown>;
  model?: string;
  params?: OpenRouterParams;
}

export interface OpenRouterChatCompletionResponse {
  id?: string;
  choices: {
    index?: number;
    message?: {
      role?: OpenRouterRole;
      content?: string;
    };
    delta?: {
      role?: OpenRouterRole;
      content?: string;
    };
    finish_reason?: string | null;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
