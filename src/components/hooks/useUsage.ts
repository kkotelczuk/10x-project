import * as React from "react";

export interface UsageSummary {
  remaining: number;
  limit: number;
}

interface UseUsageResult {
  usage: UsageSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsage(): UseUsageResult {
  const [usage, setUsage] = React.useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchUsage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/usage", {
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
          throw new Error(body?.error || "Nie udało się pobrać limitu.");
        }

        const data = (await response.json()) as UsageSummary;
        setUsage(data ?? null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Błąd sieci.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();

    return () => controller.abort();
  }, [refreshToken]);

  return { usage, isLoading, error, refetch };
}
