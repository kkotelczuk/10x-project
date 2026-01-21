import * as React from "react";

import type { ProfileDTO, UserDashboardContext } from "@/types";

interface UseProfileSummaryResult {
  profile: UserDashboardContext | null;
  isLoading: boolean;
  isMissing: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfileSummary(): UseProfileSummaryResult {
  const [profile, setProfile] = React.useState<UserDashboardContext | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMissing, setIsMissing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      setIsMissing(false);

      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (response.status === 404) {
          setProfile(null);
          setIsMissing(true);
          return;
        }

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "Nie udało się pobrać profilu.");
        }

        const data = (await response.json()) as ProfileDTO;
        setProfile({
          displayName: data.display_name ?? null,
          currentDietId: data.diet_id ?? null,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Błąd sieci.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [refreshToken]);

  return { profile, isLoading, isMissing, error, refetch };
}
