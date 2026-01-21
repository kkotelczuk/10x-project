import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UsageProgressBarProps {
  remaining: number;
  limit: number;
  isLoading?: boolean;
}

export function UsageProgressBar({ remaining, limit, isLoading }: UsageProgressBarProps) {
  const hasLimit = limit > 0;
  const used = hasLimit ? Math.min(limit, Math.max(0, limit - remaining)) : 0;
  const progress = hasLimit ? Math.round((used / limit) * 100) : 0;
  const label = isLoading ? "—/—" : hasLimit ? `${remaining}/${limit}` : "Brak danych";

  return (
    <div className="w-full sm:w-64 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Dzienny limit</span>
        <Badge variant={remaining === 0 && hasLimit ? "secondary" : "outline"}>{label}</Badge>
      </div>
      <Progress value={progress} aria-label="Wykorzystanie dziennego limitu" />
    </div>
  );
}
