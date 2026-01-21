import * as React from "react";
import { GenerateForm } from "@/components/recipe-gen/GenerateForm";
import { CreditCounter, type UsageVM } from "@/components/recipe-gen/CreditCounter";

const MIN_CHARS_TRIMMED = 3;
const MAX_CHARS = 1000;

export function RecipeGenView() {
  const [text, setText] = React.useState("");

  // Placeholder for later steps (API + limit handling).
  const [usage] = React.useState<UsageVM | null>(null);
  const isBusy = false;
  const limitReached = false;

  const trimmedLen = React.useMemo(() => text.trim().length, [text]);

  const validationMessage = React.useMemo(() => {
    if (text.length === 0) return null;
    if (trimmedLen < MIN_CHARS_TRIMMED) return "Wklej co najmniej 3 znaki.";
    if (text.length > MAX_CHARS) return "Tekst jest za długi (max 1000 znaków).";
    return null;
  }, [text, trimmedLen]);

  const canSubmit = trimmedLen >= MIN_CHARS_TRIMMED && text.length <= MAX_CHARS;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    if (limitReached) {
      return;
    }

    // In later steps this will open the confirmation dialog.
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modyfikuj przepis</h1>
          <p className="text-sm text-muted-foreground">Wklej przepis, a my dostosujemy go do Twoich preferencji.</p>
        </div>
        <CreditCounter usage={usage} />
      </header>

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
