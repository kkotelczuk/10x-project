import * as React from "react";

import type { DashboardFiltersState, RecipeListItemDTO } from "@/types";

interface UseRecipesResult {
  recipes: RecipeListItemDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEBOUNCE_MS = 500;

export function useRecipes(filters: DashboardFiltersState): UseRecipesResult {
  const [recipes, setRecipes] = React.useState<RecipeListItemDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [debouncedSearch, setDebouncedSearch] = React.useState(filters.search);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [filters.search]);

  const refetch = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchRecipes = async () => {
      setIsLoading(true);
      setError(null);

      const url = new URL("/rest/v1/recipes", window.location.origin);
      url.searchParams.set("select", "id,title,diet_label,created_at,is_active,prep_time_minutes");
      url.searchParams.set("order", filters.sort);

      const trimmedSearch = debouncedSearch.trim();
      if (trimmedSearch) {
        url.searchParams.set("title", `ilike.*${trimmedSearch}*`);
      }

      if (filters.diet !== "all") {
        url.searchParams.set("diet_label", `eq.${filters.diet}`);
      }

      try {
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "Nie udało się pobrać przepisów.");
        }

        const data = (await response.json()) as RecipeListItemDTO[];
        setRecipes(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Błąd sieci.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();

    return () => controller.abort();
  }, [debouncedSearch, filters.diet, filters.sort, refreshToken]);

  return { recipes, isLoading, error, refetch };
}
