import * as React from "react";

import type { DietDTO } from "@/types";

interface UseDietsResult {
  diets: DietDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDiets(): UseDietsResult {
  const [diets, setDiets] = React.useState<DietDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchDiets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/rest/v1/diets", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "Nie udało się pobrać diet.");
        }

        const data = (await response.json()) as DietDTO[];
        setDiets(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Błąd sieci.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiets();

    return () => controller.abort();
  }, [refreshToken]);

  return { diets, isLoading, error, refetch };
}
