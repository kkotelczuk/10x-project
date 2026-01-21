import * as React from "react";

import type { AuthFormErrors, AuthFormMode, AuthFormState, PasswordStrength } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

interface AuthFormProps {
  mode: AuthFormMode;
  state: AuthFormState;
  errors: AuthFormErrors;
  passwordStrength: PasswordStrength;
  isSubmitDisabled: boolean;
  onChange: (next: Partial<AuthFormState>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AuthForm({
  mode,
  state,
  errors,
  passwordStrength,
  isSubmitDisabled,
  onChange,
  onSubmit,
  isSubmitting,
}: AuthFormProps) {
  const emailId = React.useId();
  const passwordId = React.useId();
  const termsId = React.useId();
  const isRegister = mode === "register";

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@email.com"
          value={state.email}
          onChange={(event) => onChange({ email: event.target.value })}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
        />
        {errors.email ? (
          <p id={`${emailId}-error`} className="text-xs text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Hasło</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="••••••••"
          value={state.password}
          onChange={(event) => onChange({ password: event.target.value })}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? `${passwordId}-error` : undefined}
        />
        {errors.password ? (
          <p id={`${passwordId}-error`} className="text-xs text-destructive">
            {errors.password}
          </p>
        ) : null}
        {isRegister ? <PasswordStrengthMeter strength={passwordStrength} /> : null}
      </div>

      {isRegister ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id={termsId}
              checked={state.termsAccepted}
              onCheckedChange={(checked) => onChange({ termsAccepted: Boolean(checked) })}
              aria-invalid={Boolean(errors.termsAccepted)}
              aria-describedby={errors.termsAccepted ? `${termsId}-error` : undefined}
            />
            <Label htmlFor={termsId} className="text-sm text-foreground">
              Akceptuję regulamin i politykę prywatności
            </Label>
          </div>
          {errors.termsAccepted ? (
            <p id={`${termsId}-error`} className="text-xs text-destructive">
              {errors.termsAccepted}
            </p>
          ) : null}
        </div>
      ) : null}

      <Button className="w-full" type="submit" disabled={isSubmitting || isSubmitDisabled}>
        {isSubmitting ? "Przetwarzanie..." : isRegister ? "Zarejestruj się" : "Zaloguj się"}
      </Button>
    </form>
  );
}
