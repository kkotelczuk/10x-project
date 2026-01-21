import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  displayName: string | null;
  currentDietName?: string | null;
  showDietChangeNotice: boolean;
}

export function ProfileHeader({ displayName, currentDietName, showDietChangeNotice }: ProfileHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{displayName ? `Profil: ${displayName}` : "Profil użytkownika"}</h1>
        <p className="text-muted-foreground">Zaktualizuj dietę, alergeny i listę produktów, których chcesz unikać.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Aktualna dieta:</span>
        <Badge variant="secondary">{currentDietName || "Brak"}</Badge>
      </div>
      {showDietChangeNotice ? (
        <Alert>
          <AlertTitle>Zmiana diety</AlertTitle>
          <AlertDescription>
            Po zapisaniu zmian dotychczasowe przepisy zostaną oznaczone jako nieaktualne.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
