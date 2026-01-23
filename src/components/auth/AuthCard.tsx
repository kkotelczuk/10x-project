import * as React from "react";
import { toast } from "sonner";

import type { AuthFormErrors, AuthFormMode, AuthFormState, ResetPasswordState } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLinks } from "@/components/auth/AuthLinks";
import { ResetPasswordDialog } from "@/components/auth/ResetPasswordDialog";
import { useAuthActions } from "@/components/hooks/useAuthActions";
import { usePasswordStrength } from "@/components/hooks/usePasswordStrength";

interface AuthCardProps {
  mode: AuthFormMode;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildErrorMessage = (message: string, mode: AuthFormMode) => {
  const normalized = message.toLowerCase();
  if (mode === "login" && normalized.includes("invalid login credentials")) {
    return "Nieprawidłowy email lub hasło.";
  }
  if (mode === "register" && (normalized.includes("already") || normalized.includes("exists"))) {
    return "Konto już istnieje. Zaloguj się.";
  }
  if (normalized.includes("oauth") || normalized.includes("provider")) {
    return "Logowanie przerwane.";
  }
  return message;
};

export function AuthCard({ mode }: AuthCardProps) {
  const { signInWithPassword, signUp, resetPasswordForEmail } = useAuthActions();
  const [state, setState] = React.useState<AuthFormState>({
    email: "",
    password: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = React.useState<AuthFormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetState, setResetState] = React.useState<ResetPasswordState>({
    email: "",
    status: "idle",
  });
  const [isResetSubmitting, setIsResetSubmitting] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const passwordStrength = usePasswordStrength(state.password);

  const validateForm = React.useCallback(
    (nextState: AuthFormState): AuthFormErrors => {
      const nextErrors: AuthFormErrors = {};

      if (!nextState.email.trim()) {
        nextErrors.email = "Email jest wymagany.";
      } else if (!emailRegex.test(nextState.email.trim())) {
        nextErrors.email = "Podaj poprawny adres email.";
      }

      if (!nextState.password) {
        nextErrors.password = "Hasło jest wymagane.";
      } else if (nextState.password.length < 8) {
        nextErrors.password = "Hasło musi mieć co najmniej 8 znaków.";
      } else if (mode === "register") {
        if (!/[0-9]/.test(nextState.password) || !/[^A-Za-z0-9]/.test(nextState.password)) {
          nextErrors.password = "Hasło musi zawierać cyfrę i znak specjalny.";
        } else if (!/[A-Za-z]/.test(nextState.password)) {
          nextErrors.password = "Hasło musi zawierać literę.";
        }
      }

      if (mode === "register" && !nextState.termsAccepted) {
        nextErrors.termsAccepted = "Zaakceptuj regulamin, aby kontynuować.";
      }

      return nextErrors;
    },
    [mode]
  );

  const isFormValid = React.useMemo(() => {
    return Object.keys(validateForm(state)).length === 0;
  }, [state, validateForm]);

  const handleChange = React.useCallback(
    (next: Partial<AuthFormState>) => {
      const nextState = { ...state, ...next };
      setState(nextState);
      const nextErrors = validateForm(nextState);
      if (nextErrors.form) delete nextErrors.form;
      setErrors(nextErrors);
    },
    [state, validateForm]
  );

  const handleSubmit = React.useCallback(async () => {
    const nextErrors = validateForm(state);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "login") {
        await signInWithPassword(state.email.trim(), state.password);
        toast.success("Zalogowano pomyślnie.");
        let needsOnboarding = false;
        try {
          const profileResponse = await fetch("/api/profile", {
            method: "GET",
            credentials: "same-origin",
          });
          if (profileResponse.status === 404) {
            needsOnboarding = true;
          } else if (profileResponse.ok) {
            const profile = (await profileResponse.json()) as { diet_id?: string | null };
            needsOnboarding = !profile.diet_id;
          }
        } catch {
          needsOnboarding = false;
        }
        window.location.assign(needsOnboarding ? "/onboarding" : "/dashboard");
        return;
      }

      await signUp(state.email.trim(), state.password, state.termsAccepted);
      toast.success("Konto utworzone. Dokończ onboarding.");
      window.location.assign("/onboarding");
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? buildErrorMessage(String(error.message), mode)
          : "Spróbuj ponownie.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, signInWithPassword, signUp, state, validateForm]);

  const handleResetSubmit = React.useCallback(async () => {
    setResetError(null);
    const trimmed = resetState.email.trim();
    if (!trimmed) {
      setResetError("Email jest wymagany.");
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setResetError("Podaj poprawny adres email.");
      return;
    }

    setResetState((prev) => ({ ...prev, status: "idle" }));
    setIsResetSubmitting(true);
    try {
      await resetPasswordForEmail(trimmed);
      setResetState((prev) => ({ ...prev, status: "success" }));
      toast.success("Link resetujący został wysłany.");
    } catch {
      setResetState((prev) => ({ ...prev, status: "error" }));
      toast.error("Spróbuj ponownie.");
    } finally {
      setIsResetSubmitting(false);
    }
  }, [resetPasswordForEmail, resetState.email]);

  const handleResetEmailChange = React.useCallback((email: string) => {
    setResetState((prev) => ({ ...prev, email }));
  }, []);

  const handleResetOpen = React.useCallback(() => {
    setResetState((prev) => ({
      ...prev,
      email: state.email,
      status: "idle",
    }));
    setResetError(null);
    setResetOpen(true);
  }, [state.email]);

  const title = mode === "login" ? "Zaloguj się" : "Stwórz konto";

  return (
    <>
      <Card>
        <CardHeader className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Wróć do swoich przepisów w kilka sekund."
              : "Załóż konto i generuj przepisy dopasowane do Twojej diety."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.form ? (
            <Alert variant="destructive">
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          ) : null}

          <AuthForm
            mode={mode}
            state={state}
            errors={errors}
            passwordStrength={passwordStrength}
            isSubmitDisabled={!isFormValid}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          <AuthLinks mode={mode} onResetPassword={handleResetOpen} />
        </CardContent>
      </Card>

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        state={resetState}
        error={resetError}
        isSubmitting={isResetSubmitting}
        onChange={handleResetEmailChange}
        onSubmit={handleResetSubmit}
      />
    </>
  );
}
