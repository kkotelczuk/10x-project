import React from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useAuthActions } from "@/components/hooks/useAuthActions";

interface LogoutButtonProps {
  onLogout?: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { signOut } = useAuthActions();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      onLogout?.();
      window.location.assign("/login");
    } catch (err) {
      logger.error("Failed to log out", err);
      window.location.assign("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
}
