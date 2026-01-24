import * as React from "react";
import { GenerateForm } from "@/components/recipe-gen/GenerateForm";
import { CreditCounter, type UsageVM } from "@/components/recipe-gen/CreditCounter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GenerateRecipeResponse } from "@/types";
import { logger } from "@/lib/logger";

const MIN_CHARS_TRIMMED = 3;
const MAX_CHARS = 1000;

export function RecipeGenView() {
  const [text, setText] = React.useState("");
  const [usage, setUsage] = React.useState<UsageVM | null>(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isUsageLoading, setIsUsageLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const trimmedLen = React.useMemo(() => text.trim().length, [text]);

  const validationMessage = React.useMemo(() => {
    if (text.length === 0) return null;
    if (trimmedLen < MIN_CHARS_TRIMMED) return "Wklej co najmniej 3 znaki.";
    if (text.length > MAX_CHARS) return "Tekst jest za długi (max 1000 znaków).";
    return null;
  }, [text, trimmedLen]);

  const canSubmit = trimmedLen >= MIN_CHARS_TRIMMED && text.length <= MAX_CHARS;

  const fetchUsage = React.useCallback(async () => {
    setIsUsageLoading(true);
    try {
      const response = await fetch("/api/usage", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Nie udało się pobrać limitu.");
      }

      const data = (await response.json()) as UsageVM;
      setUsage(data);
    } catch (err) {
      logger.error("Usage fetch error:", err);
    } finally {
      setIsUsageLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const limitReached = usage?.remaining === 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    if (limitReached) {
      return;
    }
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ original_text: text }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = (await response.json().catch(() => null)) as GenerateRecipeResponse | { error?: string } | null;

      if (!response.ok) {
        if (response.status === 429) {
          setUsage((prev) => prev ?? { remaining: 0, limit: 3 });
          throw new Error("Dzienny limit generowania przepisów został wykorzystany. Spróbuj ponownie jutro.");
        }
        if (response.status === 422 || response.status === 400) {
          throw new Error(
            (data as { error?: string } | null)?.error ||
              "Nie udało się wygenerować przepisu z podanego tekstu. Spróbuj opisać go inaczej."
          );
        }
        throw new Error((data as { error?: string } | null)?.error || "Wystąpił nieoczekiwany błąd.");
      }

      const successData = data as GenerateRecipeResponse;
      setUsage({
        remaining: successData.usage.remaining,
        limit: successData.usage.limit,
      });
      setText("");
      window.location.assign(`/recipe/${successData.recipe.id}`);
    } catch (err) {
      logger.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas komunikacji z serwerem.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modyfikuj przepis</h1>
          <p className="text-sm text-muted-foreground">Wklej przepis, a my dostosujemy go do Twoich preferencji.</p>
        </div>
        <CreditCounter usage={usage} isLoading={isUsageLoading} />
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <GenerateForm
        value={text}
        onTextChange={setText}
        onSubmit={handleSubmit}
        isDisabled={!canSubmit}
        isBusy={isBusy}
        limitReached={limitReached}
        validationMessage={validationMessage}
      />
    </div>
  );
}
