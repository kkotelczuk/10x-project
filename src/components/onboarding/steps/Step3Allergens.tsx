import React from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AllergenDTO } from "@/types";
import { cn } from "@/lib/utils";

interface Step3AllergensProps {
  allergens: AllergenDTO[];
  selectedAllergenIds: string[];
  onUpdate: (data: { allergen_ids: string[] }) => void;
}

export function Step3Allergens({ allergens, selectedAllergenIds, onUpdate }: Step3AllergensProps) {
  const toggleAllergen = (id: string) => {
    if (selectedAllergenIds.includes(id)) {
      onUpdate({ allergen_ids: selectedAllergenIds.filter((aid) => aid !== id) });
    } else {
      onUpdate({ allergen_ids: [...selectedAllergenIds, id] });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Any allergies?</CardTitle>
        <CardDescription>Select any ingredients you are allergic to.</CardDescription>
      </CardHeader>

      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen) => {
          const isSelected = selectedAllergenIds.includes(allergen.id);
          return (
            <div
              key={allergen.id}
              onClick={() => toggleAllergen(allergen.id)}
              className={cn(
                "cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-transparent text-foreground"
              )}
            >
              {allergen.name}
            </div>
          );
        })}
      </div>

      {allergens.length === 0 && <p className="text-sm text-muted-foreground">No allergens available to select.</p>}
    </div>
  );
}
