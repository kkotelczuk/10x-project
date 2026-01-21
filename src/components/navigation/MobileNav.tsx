import * as React from "react";
import { MenuIcon, XIcon, UserIcon } from "lucide-react";

import type { NavUserViewModel } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  user: NavUserViewModel | null;
  onLogout: () => void;
  onThemeToggle: () => void;
}

const navLinks = [
  { href: "/dashboard", label: "Twoje przepisy" },
  { href: "/generate", label: "Generuj" },
  { href: "/profile", label: "Profil" },
];

export function MobileNav({ user, onLogout, onThemeToggle }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        <a href="/dashboard" className="text-base font-semibold text-foreground">
          10xDiet
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
        >
          <MenuIcon className="size-5" />
        </Button>
      </div>

      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        aria-label="Zamknij menu"
        disabled={!open}
      />

      <aside
        id={panelId}
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-72 bg-background shadow-lg transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserIcon className="size-4" />
            {user?.displayName ?? "Gość"}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <XIcon className="size-5" />
          </Button>
        </div>
        <div className="flex h-full flex-col justify-between px-4 py-6">
          <nav className="flex flex-col gap-3 text-sm text-muted-foreground" aria-label="Nawigacja">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded px-2 py-2 text-foreground hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onThemeToggle}>
              Przełącz motyw
            </Button>
            {user ? (
              <Button type="button" variant="destructive" onClick={onLogout}>
                Wyloguj się
              </Button>
            ) : (
              <Button asChild>
                <a href="/login">Zaloguj się</a>
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
