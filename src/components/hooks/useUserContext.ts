import * as React from "react";

import type { NavUserViewModel } from "@/types";
import { isMockAuthenticated, readMockUser } from "@/components/hooks/authStorage";

interface UseUserContextResult {
  user: NavUserViewModel | null;
  isAuthenticated: boolean;
}

export function useUserContext(): UseUserContextResult {
  const [user, setUser] = React.useState<NavUserViewModel | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const updateState = () => {
      const nextUser = readMockUser();
      setUser(nextUser);
      setIsAuthenticated(isMockAuthenticated());
    };

    updateState();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null) {
        updateState();
        return;
      }
      if (event.key.includes("mock-")) {
        updateState();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("mock-auth-change", updateState);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mock-auth-change", updateState);
    };
  }, []);

  return { user, isAuthenticated };
}
