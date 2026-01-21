import * as React from "react";
import { toast } from "sonner";

import { useAuthActions } from "@/components/hooks/useAuthActions";
import { useUserContext } from "@/components/hooks/useUserContext";
import { useUsageQuota } from "@/components/hooks/useUsageQuota";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { MobileNav } from "@/components/navigation/MobileNav";
import { MobileFab } from "@/components/navigation/MobileFab";

const THEME_KEY = "theme-preference";

const toggleTheme = () => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const nextIsDark = !isDark;
  root.classList.toggle("dark", nextIsDark);
  localStorage.setItem(THEME_KEY, nextIsDark ? "dark" : "light");
};

export function NavigationShell() {
  const { user } = useUserContext();
  const { usage } = useUsageQuota();
  const { signOut } = useAuthActions();

  const handleLogout = React.useCallback(async () => {
    try {
      await signOut();
      toast.success("Wylogowano pomyślnie.");
      window.location.assign("/login");
    } catch {
      toast.error("Nie udało się wylogować.");
    }
  }, [signOut]);

  const handleThemeToggle = React.useCallback(() => {
    toggleTheme();
  }, []);

  const handleFabClick = React.useCallback(() => {
    if (usage?.isLimitReached) {
      toast.warning("Limit generacji został wyczerpany.");
      return;
    }
    window.location.assign("/generate");
  }, [usage?.isLimitReached]);

  return (
    <>
      <TopNavBar
        user={user}
        onLogout={handleLogout}
        onThemeToggle={handleThemeToggle}
        isUsageLimitReached={usage?.isLimitReached ?? false}
      />
      <MobileNav user={user} onLogout={handleLogout} onThemeToggle={handleThemeToggle} />
      <MobileFab usage={usage} onClick={handleFabClick} />
    </>
  );
}
