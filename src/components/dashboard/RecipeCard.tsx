import { Info } from "lucide-react";

import type { RecipeListItemDTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipeCardProps {
  recipe: RecipeListItemDTO;
  isStale: boolean;
}

function formatRelativeDate(dateString: string): string {
  const created = new Date(dateString);
  if (Number.isNaN(created.getTime())) return "Nieznana data";

  const diffMs = created.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });
  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, "day");
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, "hour");
  }

  const diffMinutes = Math.round(diffMs / (1000 * 60));
  return rtf.format(diffMinutes, "minute");
}

export function RecipeCard({ recipe, isStale }: RecipeCardProps) {
  const dietLabel = recipe.diet_label || "Brak diety";

  return (
    <a href={`/recipe/${recipe.id}`} className="block h-full">
      <Card className={`h-full transition-shadow hover:shadow-md ${isStale ? "grayscale opacity-75" : ""}`}>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline">{dietLabel}</Badge>
            <span className="text-xs text-muted-foreground">{formatRelativeDate(recipe.created_at)}</span>
          </div>
          <CardTitle className="text-lg">{recipe.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Przygotowanie:</span>
            <Badge variant="secondary">{recipe.prep_time_minutes ?? "—"} min</Badge>
          </div>
          {isStale && (
            <div className="flex items-center gap-2 text-xs">
              <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Nieaktualna dieta</span>
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
