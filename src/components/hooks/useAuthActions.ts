import type { AuthError } from "@/types";
import { emitAuthChange } from "@/components/hooks/authStorage";

const mapAuthError = (error: { message: string; status?: number; code?: string }): AuthError => {
  return {
    code: error.code ?? (error.status ? String(error.status) : undefined),
    message: error.message || "Błąd autoryzacji.",
  };
};

const requestJson = async <T>(input: RequestInfo | URL, init: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? String(data.error) : "Błąd autoryzacji.";
    throw mapAuthError({ message, status: response.status });
  }

  return data as T;
};

export function useAuthActions() {
  const signInWithPassword = async (email: string, password: string) => {
    if (!email || !password) {
      throw mapAuthError({ message: "Brak danych logowania." });
    }
    await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    emitAuthChange();
  };

  const signUp = async (email: string, password: string, acceptTerms = false) => {
    if (!email || !password) {
      throw mapAuthError({ message: "Brak danych rejestracji." });
    }
    await requestJson("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, acceptTerms }),
    });
    emitAuthChange();
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!email) {
      throw mapAuthError({ message: "Email jest wymagany." });
    }
    await requestJson("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const updatePassword = async (password: string) => {
    if (!password) {
      throw mapAuthError({ message: "Hasło jest wymagane." });
    }
    await requestJson("/api/auth/update-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  };

  const signOut = async () => {
    await requestJson("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
    emitAuthChange();
  };

  return {
    signInWithPassword,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  };
}
