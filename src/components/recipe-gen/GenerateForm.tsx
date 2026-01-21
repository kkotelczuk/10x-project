import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface GenerateFormProps {
  value: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  isDisabled: boolean;
  isBusy: boolean;
  limitReached: boolean;
  validationMessage?: string | null;
}

const MAX_CHARS = 1000;

export function GenerateForm({
  value,
  onTextChange,
  onSubmit,
  isDisabled,
  isBusy,
  limitReached,
  validationMessage,
}: GenerateFormProps) {
  const textareaId = React.useId();
  const validationId = React.useId();
  const helperId = React.useId();

  const charCount = value.length;
  const hasValidation = Boolean(validationMessage);
  const isLocked = limitReached;

  const describedBy = [helperId, hasValidation ? validationId : null, isLocked ? `${textareaId}-limit` : null]
    .filter(Boolean)
    .join(" ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Modyfikuj przepis</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-4">
              <Label htmlFor={textareaId}>Wklej tekst przepisu</Label>
              <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {charCount}/{MAX_CHARS}
              </p>
            </div>

            <textarea
              id={textareaId}
              className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Np. szybki obiad z kurczakiem i ryżem, bez glutenu..."
              value={value}
              onChange={(e) => onTextChange(e.target.value)}
              disabled={isBusy || isLocked}
              maxLength={MAX_CHARS}
              aria-invalid={hasValidation ? true : undefined}
              aria-describedby={describedBy}
            />

            <p id={helperId} className="text-xs text-muted-foreground">
              Limit: {MAX_CHARS} znaków. Minimum: 3 znaki (po usunięciu spacji na początku i końcu).
            </p>

            {hasValidation && (
              <p id={validationId} className="text-xs text-destructive">
                {validationMessage}
              </p>
            )}

            {isLocked && (
              <p id={`${textareaId}-limit`} className="text-xs text-destructive">
                Wykorzystałeś dzienny limit modyfikacji (3/3). Wróć do nas jutro!
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription>
              Aplikacja ma charakter edukacyjny. Zawsze weryfikuj informacje i dostosuj posiłki do swoich potrzeb.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isDisabled || isBusy || isLocked}>
            {isBusy ? "Pracuję..." : "Modyfikuj"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
