# Future Upgrades / Follow-ups

This file captures **non-blocking improvements** and follow-ups discovered while implementing features, so we can keep the current scope minimal and still remember what to do next.

## Recipe Details view (`/recipe/[id]`)

### What’s implemented (current minimal flow)

- **SSR recipe details page**: `src/pages/recipe/[id].astro`
  - UUID validation + **404/500** handling
  - SSR fetch via `RecipeService(Astro.locals.supabase)`
  - Safe coercion of `ingredients` / `instructions` JSON arrays
- **Static (Astro) sections**:
  - `src/components/recipe/RecipeHeader.astro`
  - `src/components/recipe/IngredientsSection.astro`
  - `src/components/recipe/InstructionsSection.astro`
  - `src/components/recipe/RecipeStatusCard.astro` (extracted to avoid nested ternaries)
- **Client (React island) actions**: `src/components/recipe/RecipeActions.tsx`
  - **Copy to clipboard** + toast
  - **Delete** with `DeleteRecipeDialog` + `DELETE /rest/v1/recipes?id=...` + toast + redirect to `/`
- **Global toasts**:
  - `src/components/ui/sonner.tsx` (no Next.js directives)
  - Mounted once in `src/layouts/Layout.astro`

### Future upgrades (intentionally deferred)

- **Better DELETE error mapping**:
  - Handle **403** explicitly (not authorized / not owner) with a user-friendly message.
  - Prefer consistent, client-friendly error payloads from the API (or map server messages defensively).
  - Consider differentiating **network errors** vs backend errors.
- **Dialog UX tightening**:
  - Prevent closing the dialog while `isDeleting === true` (or disable overlay close / escape).
  - Keep the dialog open on error (currently we close after attempt; consider keeping open for retry).
- **String centralization**:
  - Move view strings into a single module (or future i18n setup) to avoid scattering.
- **Copy formatting polish**:
  - Optional: include prep time / diet label in clipboard output.
  - Optional: normalize step numbering when `step` is missing/non-sequential.
- **Telemetry / logging**:
  - Optional: capture delete/copy events for analytics (if needed).
