import type { DietDTO, DashboardFiltersState } from "@/types";

import { SearchInput } from "@/components/dashboard/SearchInput";
import { DietSelect } from "@/components/dashboard/DietSelect";
import { SortSelect } from "@/components/dashboard/SortSelect";

interface DashboardFiltersProps {
  currentFilters: DashboardFiltersState;
  diets: DietDTO[];
  isDietsLoading?: boolean;
  onSearchChange: (value: string) => void;
  onDietChange: (value: string) => void;
  onSortChange: (value: DashboardFiltersState["sort"]) => void;
}

export function DashboardFilters({
  currentFilters,
  diets,
  isDietsLoading,
  onSearchChange,
  onDietChange,
  onSortChange,
}: DashboardFiltersProps) {
  return (
    <section className="sticky top-0 z-20 border-b bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex flex-col gap-3 px-4 md:flex-row md:items-center">
        <SearchInput value={currentFilters.search} onChange={onSearchChange} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DietSelect value={currentFilters.diet} diets={diets} isLoading={isDietsLoading} onChange={onDietChange} />
          <SortSelect value={currentFilters.sort} onChange={onSortChange} />
        </div>
      </div>
    </section>
  );
}
