import type { AuthFormMode } from "@/types";

interface AuthLinksProps {
  mode: AuthFormMode;
  onResetPassword: () => void;
}

export function AuthLinks({ mode, onResetPassword }: AuthLinksProps) {
  const isLogin = mode === "login";

  return (
    <div className="flex flex-col gap-2 text-sm">
      {isLogin ? (
        <button type="button" onClick={onResetPassword} className="text-primary hover:underline text-left">
          Zapomniałeś hasła?
        </button>
      ) : null}
      <a href={isLogin ? "/register" : "/login"} className="text-muted-foreground hover:text-foreground">
        {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
      </a>
    </div>
  );
}
