src/
+-- components/
| +-- auth/
| | +-- AuthCard.tsx
| | +-- AuthForm.tsx
| | +-- AuthLinks.tsx
| | +-- AuthPageLayout.astro
| | +-- GoogleAuthButton.tsx
| | +-- PasswordStrengthMeter.tsx
| | +-- ResetPasswordDialog.tsx
| | +-- ResetPasswordPage.tsx
| +-- dashboard/
| | +-- DashboardFilters.tsx
| | +-- DashboardView.tsx
| | +-- DietSelect.tsx
| | +-- FloatingActionButton.tsx
| | +-- RecipeCard.tsx
| | +-- RecipeCardSkeleton.tsx
| | +-- RecipeGrid.tsx
| | +-- SearchInput.tsx
| | +-- SortSelect.tsx
| | +-- UsageProgressBar.tsx
| | +-- WelcomeHeader.tsx
| +-- hooks/
| | +-- authStorage.ts
| | +-- useAllergens.ts
| | +-- useAuthActions.ts
| | +-- useDiets.ts
| | +-- usePasswordStrength.ts
| | +-- useProfile.ts
| | +-- useProfileSummary.ts
| | +-- useRecipes.ts
| | +-- useUsage.ts
| | +-- useUsageQuota.ts
| | +-- useUserContext.ts
| +-- navigation/
| | +-- MobileFab.tsx
| | +-- MobileNav.tsx
| | +-- NavigationShell.tsx
| | +-- TopNavBar.tsx
| +-- onboarding/
| | +-- OnboardingWizard.tsx
| | +-- steps/
| | +-- Step1BasicInfo.tsx
| | +-- Step2DietSelection.tsx
| | +-- Step3Allergens.tsx
| | +-- Step4Dislikes.tsx
| +-- profile/
| | +-- LogoutButton.tsx
| | +-- ProfileErrorState.tsx
| | +-- ProfileHeader.tsx
| | +-- ProfileLoadingState.tsx
| | +-- ProfileView.tsx
| | +-- ProfileWizardCard.tsx
| +-- recipe/
| | +-- DeleteRecipeDialog.tsx
| | +-- IngredientsList.tsx
| | +-- IngredientsSection.astro
| | +-- InstructionsList.tsx
| | +-- InstructionsSection.astro
| | +-- RecipeActions.tsx
| | +-- RecipeHeader.astro
| | +-- RecipeHeader.tsx
| | +-- RecipeStatusCard.astro
| +-- recipe-gen/
| | +-- CreditCounter.tsx
| | +-- GenerateForm.tsx
| | +-- RecipeGenView.tsx
| +-- ui/
| | +-- accordion.tsx
| | +-- alert-dialog.tsx
| | +-- alert.tsx
| | +-- badge.tsx
| | +-- button.tsx
| | +-- card.tsx
| | +-- checkbox.tsx
| | +-- form.tsx
| | +-- input.tsx
| | +-- label.tsx
| | +-- progress.tsx
| | +-- radio-group.tsx
| | +-- scroll-area.tsx
| | +-- select.tsx
| | +-- separator.tsx
| | +-- sonner.tsx
| +-- GenerateRecipeForm.test.tsx
| +-- GenerateRecipeForm.tsx
| +-- Welcome.astro
+-- db/
| +-- database.types.ts
| +-- supabase.client.ts
+-- layouts/
| +-- Layout.astro
+-- lib/
| +-- logger.ts
| +-- utils.ts
| +-- services/
| +-- allergen.service.ts
| +-- diet.service.ts
| +-- ingredient.service.ts
| +-- OpenRouterService.ts
| +-- profile.service.ts
| +-- recipe.service.ts
+-- middleware/
| +-- index.ts
+-- pages/
| +-- api/
| | +-- auth/
| | | +-- login.ts
| | | +-- logout.ts
| | | +-- register.ts
| | | +-- reset.ts
| | | +-- session.ts
| | | +-- update-password.ts
| | +-- generate.ts
| | +-- profile.ts
| | +-- usage.ts
| +-- rest/
| | +-- v1/
| | +-- allergens.ts
| | +-- diets.ts
| | +-- ingredients.ts
| | +-- recipes.ts
| +-- dashboard.astro
| +-- generate.astro
| +-- index.astro
| +-- login.astro
| +-- onboarding.astro
| +-- profile.astro
| +-- recipe/
| | +-- [id].astro
| +-- register.astro
| +-- reset-password.astro
+-- styles/
| +-- global.css
+-- test/
| +-- setup.ts
+-- env.d.ts
+-- types.ts
