import * as React from "react";

import type { AllergenDTO } from "@/types";

interface UseAllergensResult {
  allergens: AllergenDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAllergens(): UseAllergensResult {
  const [allergens, setAllergens] = React.useState<AllergenDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchAllergens = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/rest/v1/allergens", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "Nie udało się pobrać alergenów.");
        }

        const data = (await response.json()) as AllergenDTO[];
        setAllergens(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Błąd sieci.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllergens();

    return () => controller.abort();
  }, [refreshToken]);

  return { allergens, isLoading, error, refetch };
}
