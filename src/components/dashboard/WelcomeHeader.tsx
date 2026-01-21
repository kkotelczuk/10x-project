import { UsageProgressBar } from "@/components/dashboard/UsageProgressBar";

interface WelcomeHeaderProps {
  displayName: string | null;
  usage: {
    remaining: number;
    limit: number;
  };
  usageLoading?: boolean;
}

export function WelcomeHeader({ displayName, usage, usageLoading }: WelcomeHeaderProps) {
  const safeName = displayName?.trim() || "Twoje konto";

  return (
    <header className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Witaj ponownie</p>
          <h1 className="text-2xl font-semibold tracking-tight">{safeName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Zarządzaj swoimi przepisami i limitami generowania.</p>
        </div>
        <UsageProgressBar remaining={usage.remaining} limit={usage.limit} isLoading={usageLoading} />
      </div>
    </header>
  );
}
