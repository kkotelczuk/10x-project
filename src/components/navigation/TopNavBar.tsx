import * as React from "react";
import { ChevronDownIcon, LockIcon, SparklesIcon, UserIcon } from "lucide-react";

import type { NavUserViewModel } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopNavBarProps {
  user: NavUserViewModel | null;
  onLogout: () => void;
  onThemeToggle: () => void;
  isUsageLimitReached: boolean;
}

const navLinks = [
  { href: "/dashboard", label: "Twoje przepisy" },
  { href: "/profile", label: "Profil" },
];

export function TopNavBar({ user, onLogout, onThemeToggle, isUsageLimitReached }: TopNavBarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <header className="hidden border-b bg-background/95 backdrop-blur md:block">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="text-lg font-semibold text-foreground">
            10xDiet
          </a>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground" aria-label="Główna nawigacja">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isUsageLimitReached ? (
            <Button type="button" variant="outline" disabled>
              <LockIcon className="size-4" />
              Limit wyczerpany
            </Button>
          ) : (
            <Button asChild>
              <a href="/generate" className="flex items-center gap-2">
                <SparklesIcon className="size-4" />
                Generuj
              </a>
            </Button>
          )}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <UserIcon className="size-4" />
                <span>{user.displayName ?? "Użytkownik"}</span>
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </button>
              <div
                id={menuId}
                role="menu"
                className={cn(
                  "absolute right-0 z-20 mt-2 w-48 rounded-md border bg-background p-2 shadow-lg",
                  menuOpen ? "block" : "hidden"
                )}
              >
                <a href="/profile" className="block rounded px-3 py-2 text-sm hover:bg-accent">
                  Profil
                </a>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={onThemeToggle}
                >
                  Przełącz motyw
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  onClick={onLogout}
                >
                  Wyloguj się
                </button>
              </div>
            </div>
          ) : (
            <Button asChild variant="outline">
              <a href="/login">Zaloguj się</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
