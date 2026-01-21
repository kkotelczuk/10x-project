import * as React from "react";
import { toast } from "sonner";

import type { DashboardFiltersState } from "@/types";

import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { RecipeGrid } from "@/components/dashboard/RecipeGrid";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/components/hooks/useRecipes";
import { useProfileSummary } from "@/components/hooks/useProfileSummary";
import { useDiets } from "@/components/hooks/useDiets";
import { useUsage } from "@/components/hooks/useUsage";

const DEFAULT_FILTERS: DashboardFiltersState = {
  search: "",
  diet: "all",
  sort: "created_at.desc",
};

export function DashboardView() {
  const [filters, setFilters] = React.useState<DashboardFiltersState>(DEFAULT_FILTERS);

  const { recipes, isLoading: recipesLoading, error: recipesError, refetch: refetchRecipes } = useRecipes(filters);
  const { profile, isMissing: isProfileMissing, error: profileError } = useProfileSummary();
  const { diets, isLoading: dietsLoading, error: dietsError, refetch: refetchDiets } = useDiets();
  const { usage, isLoading: usageLoading, error: usageError, refetch: refetchUsage } = useUsage();

  const lastToastRef = React.useRef<string | null>(null);

  const handleSearchChange = React.useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleDietChange = React.useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, diet: value || "all" }));
  }, []);

  const handleSortChange = React.useCallback((value: DashboardFiltersState["sort"]) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  }, []);

  React.useEffect(() => {
    const nextError = recipesError || profileError || dietsError || usageError;
    if (!nextError || lastToastRef.current === nextError) return;

    toast.error(nextError);
    lastToastRef.current = nextError;
  }, [recipesError, profileError, dietsError, usageError]);

  return (
    <div className="relative space-y-6 pb-12">
      <WelcomeHeader
        displayName={profile?.displayName ?? null}
        usage={usage ?? { remaining: 0, limit: 0 }}
        usageLoading={usageLoading}
      />

      {usageError && (
        <section className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Nie udało się pobrać limitu generowania.</span>
            <Button type="button" variant="outline" size="sm" onClick={refetchUsage}>
              Spróbuj ponownie
            </Button>
          </div>
        </section>
      )}

      {isProfileMissing && (
        <section className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Uzupełnij profil, aby dopasować przepisy do diety.</span>
            <Button asChild size="sm">
              <a href="/onboarding">Uzupełnij profil</a>
            </Button>
          </div>
        </section>
      )}

      <DashboardFilters
        currentFilters={filters}
        diets={diets}
        isDietsLoading={dietsLoading}
        onSearchChange={handleSearchChange}
        onDietChange={handleDietChange}
        onSortChange={handleSortChange}
      />

      {dietsError && (
        <section className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Nie udało się pobrać listy diet.</span>
            <Button type="button" variant="outline" size="sm" onClick={refetchDiets}>
              Spróbuj ponownie
            </Button>
          </div>
        </section>
      )}

      {recipesError ? (
        <section className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          <p>Nie udało się pobrać przepisów.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={refetchRecipes}>
            Spróbuj ponownie
          </Button>
        </section>
      ) : (
        <RecipeGrid recipes={recipes} isLoading={recipesLoading} userDietId={profile?.currentDietId ?? null} />
      )}

      <FloatingActionButton />
    </div>
  );
}
