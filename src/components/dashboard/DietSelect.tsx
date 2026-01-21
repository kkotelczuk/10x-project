import type { DietDTO } from "@/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DietSelectProps {
  value: string | "all";
  diets: DietDTO[];
  isLoading?: boolean;
  onChange: (value: string) => void;
}

export function DietSelect({ value, diets, isLoading, onChange }: DietSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="Dieta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Wszystkie diety</SelectItem>
        {isLoading && <SelectItem value="all">Ładowanie...</SelectItem>}
        {!isLoading && diets.length === 0 && <SelectItem value="all">Brak danych</SelectItem>}
        {diets.map((diet) => (
          <SelectItem key={diet.id} value={diet.id}>
            {diet.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
