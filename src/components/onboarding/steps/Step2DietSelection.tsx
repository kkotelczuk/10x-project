import React from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DietDTO } from "@/types";
import { cn } from "@/lib/utils";

interface Step2DietSelectionProps {
  diets: DietDTO[];
  selectedDietId: string | null;
  onUpdate: (data: { diet_id: string }) => void;
}

export function Step2DietSelection({ diets, selectedDietId, onUpdate }: Step2DietSelectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Choose your diet</CardTitle>
        <CardDescription>Select the diet plan that best fits your lifestyle.</CardDescription>
      </CardHeader>

      <RadioGroup
        value={selectedDietId || ""}
        onValueChange={(value) => onUpdate({ diet_id: value })}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {diets.map((diet) => (
          <div key={diet.id}>
            <RadioGroupItem value={diet.id} id={diet.id} className="peer sr-only" />
            <Label
              htmlFor={diet.id}
              className={cn(
                "flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full",
                selectedDietId === diet.id && "border-primary bg-accent/50"
              )}
            >
              <div className="mb-2 w-full">
                <span className="font-semibold text-lg">{diet.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">{diet.description || "No description available."}</div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
