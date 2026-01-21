import type { DashboardFiltersState } from "@/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SortSelectProps {
  value: DashboardFiltersState["sort"];
  onChange: (value: DashboardFiltersState["sort"]) => void;
}

const OPTIONS: { label: string; value: DashboardFiltersState["sort"] }[] = [
  { label: "Najnowsze", value: "created_at.desc" },
  { label: "Najstarsze", value: "created_at.asc" },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as DashboardFiltersState["sort"])}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="Sortowanie" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
