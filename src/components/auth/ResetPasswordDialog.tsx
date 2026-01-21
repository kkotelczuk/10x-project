import * as React from "react";

import type { ResetPasswordState } from "@/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ResetPasswordState;
  error?: string | null;
  isSubmitting: boolean;
  onChange: (email: string) => void;
  onSubmit: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  state,
  error,
  isSubmitting,
  onChange,
  onSubmit,
}: ResetPasswordDialogProps) {
  const emailId = React.useId();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset hasła</AlertDialogTitle>
          <AlertDialogDescription>Podaj adres email, a wyślemy link do ustawienia nowego hasła.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              placeholder="twoj@email.com"
              value={state.email}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${emailId}-error` : undefined}
            />
            {error ? (
              <p id={`${emailId}-error`} className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          {state.status === "success" ? (
            <Alert>
              <AlertDescription>Jeśli konto istnieje, wkrótce otrzymasz wiadomość z instrukcjami.</AlertDescription>
            </Alert>
          ) : null}

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>Wystąpił problem. Spróbuj ponownie.</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Wysyłanie..." : "Wyślij link"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
