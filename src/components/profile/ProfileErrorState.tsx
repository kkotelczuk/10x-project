import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProfileErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  actionHref?: string;
  actionLabel?: string;
}

export function ProfileErrorState({
  title = "Nie udało się załadować profilu",
  message,
  onRetry,
  actionHref,
  actionLabel,
}: ProfileErrorStateProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-3">
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            Spróbuj ponownie
          </Button>
        ) : null}
        {actionHref && actionLabel ? (
          <Button asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
