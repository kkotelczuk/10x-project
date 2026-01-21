import type { RecipeListItemDTO } from "@/types";

import { RecipeCard } from "@/components/dashboard/RecipeCard";
import { RecipeCardSkeleton } from "@/components/dashboard/RecipeCardSkeleton";
import { Button } from "@/components/ui/button";

interface RecipeGridProps {
  recipes: RecipeListItemDTO[];
  isLoading: boolean;
  userDietId: string | null;
}

const SKELETON_COUNT = 6;

export function RecipeGrid({ recipes, isLoading, userDietId }: RecipeGridProps) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
          <RecipeCardSkeleton key={`skeleton-${idx}`} />
        ))}
      </section>
    );
  }

  if (recipes.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Brak przepisów. Wygeneruj pierwszy, aby pojawił się na liście.</p>
        <Button asChild className="mt-4">
          <a href="/generate">Generuj przepis</a>
        </Button>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} isStale={Boolean(userDietId && recipe.diet_label !== userDietId)} />
      ))}
    </section>
  );
}
