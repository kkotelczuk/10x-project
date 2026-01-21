import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}
