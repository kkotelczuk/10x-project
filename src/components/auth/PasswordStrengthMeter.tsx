import type { PasswordStrength } from "@/types";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
}

const getBarClass = (index: number, score: number) => {
  if (score === 0) return "bg-muted";
  if (index >= score) return "bg-muted";
  if (score <= 1) return "bg-destructive/70";
  if (score <= 3) return "bg-amber-500";
  return "bg-emerald-500";
};

export function PasswordStrengthMeter({ strength }: PasswordStrengthMeterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Siła hasła</span>
        <span className="font-medium text-foreground">{strength.label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={cn("h-1 rounded-full transition-colors", getBarClass(index, strength.score))} />
        ))}
      </div>
      <div className="grid gap-1 text-[11px] text-muted-foreground">
        <p className={strength.requirements.minLength ? "text-foreground" : undefined}>Minimum 8 znaków</p>
        <p className={strength.requirements.hasNumber ? "text-foreground" : undefined}>Przynajmniej jedna cyfra</p>
        <p className={strength.requirements.hasSpecial ? "text-foreground" : undefined}>
          Przynajmniej jeden znak specjalny
        </p>
      </div>
    </div>
  );
}
