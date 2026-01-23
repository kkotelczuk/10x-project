import * as React from "react";

import type { NavUserViewModel } from "@/types";
import { onAuthChange } from "@/components/hooks/authStorage";

interface UseUserContextResult {
  user: NavUserViewModel | null;
  isAuthenticated: boolean;
}

export function useUserContext(): UseUserContextResult {
  const [user, setUser] = React.useState<NavUserViewModel | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const fetchSession = React.useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = (await response.json()) as {
        isAuthenticated?: boolean;
        user?: NavUserViewModel | null;
      };
      setUser(data.user ?? null);
      setIsAuthenticated(Boolean(data.isAuthenticated));
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSession();
    const unsubscribe = onAuthChange(fetchSession);
    return () => {
      unsubscribe();
    };
  }, [fetchSession]);

  return { user, isAuthenticated };
}
