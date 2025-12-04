# REST API Plan

## 1. Overview & Strategy

This API plan leverages the **Astro 5 + Supabase** stack. It distinguishes between two types of resources:

1.  **Standard Resources (Supabase Data Access)**: Accessed directly via the Supabase Client (PostgREST). These rely on Row Level Security (RLS) for authorization.
2.  **Custom Business Logic (Astro Endpoints)**: Server-side endpoints (`src/pages/api/*`) used for complex operations, atomic transactions, and AI integration where API secrets must be protected.

All timestamps are returned in ISO 8601 format. All IDs are UUIDs (v4) or text slugs.

---

## 2. Resources

| Resource       | Type     | Database Entity                                     | Description                          |
| :------------- | :------- | :-------------------------------------------------- | :----------------------------------- |
| **Lookups**    | Standard | `diets`, `allergens`, `ingredients`                 | Static reference data.               |
| **Profile**    | Custom   | `profiles`, `profile_allergens`, `profile_dislikes` | User settings and preferences.       |
| **Recipes**    | Standard | `recipes`                                           | User's saved recipes library.        |
| **Generation** | Custom   | `recipes`, `generation_logs`                        | AI processing and limit enforcement. |

---

## 3. Endpoints

### 3.1. Lookups (Reference Data)

These are public/authenticated read-only endpoints accessed via Supabase Client.

#### 3.1.1. Get Diets

- **Method**: `GET`
- **Path**: `/rest/v1/diets`
- **Description**: Retrieve available diets for the onboarding wizard.
- **Query Params**: `select=*`
- **Response**:
  ```json
  [
    {
      "id": "keto",
      "name": "Ketogeniczna",
      "allowed_foods": ["meat", "fats"],
      "forbidden_foods": ["sugar", "grains"],
      "macros": { "fat": "high", "carbs": "low" }
    }
  ]
  ```

#### 3.1.2. Get Allergens

- **Method**: `GET`
- **Path**: `/rest/v1/allergens`
- **Description**: Retrieve list of allergens to exclude.
- **Response**: `[{ "id": "peanuts", "name": "Orzeszki ziemne" }, ...]`

#### 3.1.3. Search Ingredients (Dislikes)

- **Method**: `GET`
- **Path**: `/rest/v1/ingredients`
- **Description**: Searchable list of ingredients for "dislikes".
- **Query Params**:
  - `select=*`
  - `name=ilike.*{query}*` (Search functionality)
  - `is_visible=eq.true`
- **Response**: `[{ "id": "onions", "name": "Cebula", "category": "vegetable", "variants": ["cebula", "szalotka"] }]`

---

### 3.2. User Profile (Custom Logic)

Handled via Astro Endpoint (`src/pages/api/profile.ts`) to ensure atomic updates of the profile and its many-to-many relationships.

#### 3.2.1. Get Current Profile

- **Method**: `GET`
- **Path**: `/api/profile`
- **Auth**: Bearer Token (Supabase Auth)
- **Description**: Fetches user profile with joined allergens and dislikes.
- **Response**:
  ```json
  {
    "id": "uuid-user-id",
    "display_name": "Jan Kowalski",
    "diet_id": "keto",
    "allergens": ["peanuts", "milk"],
    "dislikes": ["onions"],
    "terms_accepted_at": "2024-01-01T10:00:00Z",
    "created_at": "2024-01-01T10:00:00Z"
  }
  ```

#### 3.2.2. Upsert Profile (Onboarding/Update)

- **Method**: `PUT`
- **Path**: `/api/profile`
- **Auth**: Bearer Token
- **Description**: Atomic operation. Updates `profiles` table and replaces all entries in `profile_allergens` and `profile_dislikes` for the user.
- **Request Body**:
  ```json
  {
    "diet_id": "keto", // nullable
    "allergen_ids": ["peanuts", "milk"], // array of slugs
    "dislike_ids": ["onions"], // array of slugs
    "display_name": "Jan", // optional
    "accept_terms": true // Required only on first creation
  }
  ```
- **Success (200)**: returns updated profile object.
- **Error (400)**: Validation failed (e.g., Terms not accepted on create).

---

### 3.3. Recipe Management (Standard)

Accessed via Supabase Client. RLS ensures users only see their own recipes.

#### 3.3.1. List Recipes

- **Method**: `GET`
- **Path**: `/rest/v1/recipes`
- **Description**: Dashboard list view.
- **Query Params**:
  - `select=id,title,diet_label,created_at,is_active,prep_time_minutes` (Lightweight payload)
  - `order=created_at.desc`
  - `diet_label=eq.{value}` (Filter)
  - `title=ilike.*{query}*` (Search)
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "title": "Keto Pizza",
      "diet_label": "keto",
      "is_active": true,
      "created_at": "2024-01-02T12:00:00Z"
    }
  ]
  ```

#### 3.3.2. Get Recipe Details

- **Method**: `GET`
- **Path**: `/rest/v1/recipes`
- **Query Params**: `id=eq.{uuid}`, `select=*`
- **Response**: Full recipe object including JSONB `ingredients` and `instructions`.

#### 3.3.3. Delete Recipe

- **Method**: `DELETE`
- **Path**: `/rest/v1/recipes?id=eq.{uuid}`
- **Description**: Permanently removes a recipe.

---

### 3.4. AI Generation (Custom Logic)

Handled via Astro Endpoint (`src/pages/api/generate.ts`) to protect OpenRouter API keys and enforce business limits.

#### 3.4.1. Generate Recipe

- **Method**: `POST`
- **Path**: `/api/generate`
- **Auth**: Bearer Token
- **Description**:
  1.  Checks `generation_logs` for daily limit (3/24h).
  2.  Validates input length (max 1000 chars).
  3.  Fetches user's current profile (diet, allergens, dislikes).
  4.  Calls LLM to modify recipe.
  5.  Saves result to `recipes` and logs success/failure to `generation_logs`.
- **Request Body**:
  ```json
  {
    "original_text": "Pasta carbonara recipe text..."
  }
  ```
- **Success (201)**:
  ```json
  {
    "recipe": {
      "id": "uuid",
      "title": "Keto Carbonara",
      "ingredients": [...],
      "instructions": [...]
    },
    "usage": {
      "remaining": 2,
      "limit": 3
    }
  }
  ```
- **Error (429)**: "Daily limit reached."
- **Error (422)**: "Input text is not a valid recipe."
- **Error (400)**: "Input too long" or "Missing text".

---

## 4. Authentication & Security

### 4.3. Rate Limiting

- **Business Limit**: 3 generations per 24 hours per user.
  - _Implementation_: `COUNT(*)` on `generation_logs` where `user_id = auth.uid()` AND `created_at > now() - interval '24 hours'`.

---

## 5. Data Validation & Business Logic

### 5.1. Validation Rules

| Field            | Rule                        | Error Message                             |
| :--------------- | :-------------------------- | :---------------------------------------- |
| `original_text`  | Length <= 1000 chars        | "Text is too long (max 1000 characters)." |
| `original_text`  | Non-empty string            | "Please paste a recipe."                  |
| `terms_accepted` | Must be `true` on create    | "You must accept the terms."              |
| `diet_id`        | Must exist in `diets` table | "Invalid diet selected."                  |

### 5.2. Key Logic Flows

**1. "Outdated" Recipe Flag (`is_active`)**

- **Trigger**: When `PUT /api/profile` is called successfully.
- **Logic**: The database (or the API endpoint transaction) updates `is_active = false` for all existing recipes belonging to that user.
- **Result**: Frontend displays these recipes as "Outdated" based on the `is_active` boolean.

**2. AI Modification Logic**

- **Inputs**: Original Text + User Diet + User Allergens + User Dislikes.
- **Process**:
  - System Prompt instructs AI to replace forbidden items.
  - If replacements are impossible, AI returns specific error flag/message.
  - Output is forced into JSON structure (Title, Ingredients List, Instructions List).

**3. Ingredient Dislikes (Soft filtering)**

- **Logic**: The `ingredients` table contains `variants`. If a user dislikes "Onion" (id: `onions`), the AI context includes "Avoid: Onion, Shallots, Red Onion" (derived from `variants` array).
