import * as React from "react";
import { toast } from "sonner";

import { useAuthActions } from "@/components/hooks/useAuthActions";
import { usePasswordStrength } from "@/components/hooks/usePasswordStrength";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuthActions();
  const [state, setState] = React.useState<FormState>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const strength = usePasswordStrength(state.password);

  const passwordId = React.useId();
  const confirmId = React.useId();

  const validate = React.useCallback((next: FormState): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!next.password) {
      nextErrors.password = "Hasło jest wymagane.";
    } else if (next.password.length < 8) {
      nextErrors.password = "Hasło musi mieć co najmniej 8 znaków.";
    } else if (!/[0-9]/.test(next.password) || !/[^A-Za-z0-9]/.test(next.password)) {
      nextErrors.password = "Hasło musi zawierać cyfrę i znak specjalny.";
    }

    if (!next.confirmPassword) {
      nextErrors.confirmPassword = "Powtórz hasło.";
    } else if (next.confirmPassword !== next.password) {
      nextErrors.confirmPassword = "Hasła nie są zgodne.";
    }

    return nextErrors;
  }, []);

  const handleChange = (next: Partial<FormState>) => {
    const nextState = { ...state, ...next };
    setState(nextState);
    setErrors(validate(nextState));
  };

  const handleSubmit = async () => {
    const nextErrors = validate(state);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await updatePassword(state.password);
      setIsSuccess(true);
      toast.success("Hasło zostało zaktualizowane.");
      setTimeout(() => window.location.assign("/login"), 800);
    } catch {
      setErrors({ form: "Nie udało się zaktualizować hasła." });
      toast.error("Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}
      {isSuccess ? (
        <Alert>
          <AlertDescription>Hasło zaktualizowane. Przekierowanie do logowania.</AlertDescription>
        </Alert>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor={passwordId}>Nowe hasło</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            value={state.password}
            onChange={(event) => handleChange({ password: event.target.value })}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
          />
          {errors.password ? (
            <p id={`${passwordId}-error`} className="text-xs text-destructive">
              {errors.password}
            </p>
          ) : null}
          <PasswordStrengthMeter strength={strength} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={confirmId}>Powtórz hasło</Label>
          <Input
            id={confirmId}
            type="password"
            autoComplete="new-password"
            value={state.confirmPassword}
            onChange={(event) => handleChange({ confirmPassword: event.target.value })}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? `${confirmId}-error` : undefined}
          />
          {errors.confirmPassword ? (
            <p id={`${confirmId}-error`} className="text-xs text-destructive">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        <Button className="w-full" type="submit" disabled={isSubmitting || isSuccess}>
          {isSubmitting ? "Aktualizacja..." : "Zapisz nowe hasło"}
        </Button>
      </form>
    </div>
  );
}
