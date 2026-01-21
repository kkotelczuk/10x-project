import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RecipeCardSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="h-4 w-16 rounded-full bg-muted" />
        </div>
        <div className="h-6 w-3/4 rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
