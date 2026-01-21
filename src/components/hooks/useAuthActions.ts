import type { AuthError } from "@/types";
import { clearMockUser, setMockUser } from "@/components/hooks/authStorage";

const mapAuthError = (error: { message: string; status?: number; code?: string }): AuthError => {
  return {
    code: error.code ?? (error.status ? String(error.status) : undefined),
    message: error.message || "Błąd autoryzacji.",
  };
};

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

const buildDisplayName = (email: string) => {
  const [name] = email.split("@");
  return name?.trim() || "Użytkownik";
};

export function useAuthActions() {
  const signInWithPassword = async (email: string, password: string) => {
    if (!email || !password) {
      throw mapAuthError({ message: "Brak danych logowania." });
    }
    await delay();
    setMockUser({ displayName: buildDisplayName(email) });
  };

  const signUp = async (email: string, password: string) => {
    if (!email || !password) {
      throw mapAuthError({ message: "Brak danych rejestracji." });
    }
    await delay();
    setMockUser({ displayName: buildDisplayName(email) }, false);
  };

  const signInWithGoogle = async () => {
    await delay();
    setMockUser({ displayName: "Google User" });
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!email) {
      throw mapAuthError({ message: "Email jest wymagany." });
    }
    await delay();
  };

  const updatePassword = async (password: string) => {
    if (!password) {
      throw mapAuthError({ message: "Hasło jest wymagane." });
    }
    await delay();
  };

  const signOut = async () => {
    await delay(300);
    clearMockUser();
  };

  return {
    signInWithPassword,
    signUp,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  };
}
