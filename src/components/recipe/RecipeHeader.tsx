import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface RecipeHeaderProps {
  title: string;
  dietLabel: string | null;
  prepTime: number | null;
  createdAt: string;
}

export function RecipeHeader({ title, dietLabel, prepTime, createdAt }: RecipeHeaderProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {dietLabel && (
          <Badge variant="secondary" className="text-sm font-medium">
            {dietLabel}
          </Badge>
        )}

        {prepTime && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{prepTime} min</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
