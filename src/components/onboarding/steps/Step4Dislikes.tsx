import React, { useState, useEffect, useRef } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Loader2 } from "lucide-react";
import type { IngredientDTO } from "@/types";
import { cn } from "@/lib/utils";

interface Step4DislikesProps {
  dislikeIds: string[];
  onUpdate: (data: { dislike_ids: string[] }) => void;
}

export function Step4Dislikes({ dislikeIds, onUpdate }: Step4DislikesProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IngredientDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientDTO[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchIngredients(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch full ingredient objects for initial dislikeIds if needed
  // Note: ideally the parent would pass full objects or we fetch them.
  // For now, we only have IDs.
  // Optimization: We might need an endpoint to fetch ingredients by IDs or
  // just display ID if name is missing (which is bad UX).
  // Assuming for MVP we might not have names for pre-selected IDs if we reload page.
  // But this is onboarding, so we start fresh usually.

  // However, we need to maintain the list of selected ingredients with names to show them.
  // We can track them in local state `selectedIngredients`.
  // When parent updates `dislikeIds`, we should sync if needed, but usually
  // this component drives the update.

  const searchIngredients = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/rest/v1/ingredients?query=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Failed to search ingredients", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDislike = (ingredient: IngredientDTO) => {
    if (!dislikeIds.includes(ingredient.id)) {
      const newDislikes = [...dislikeIds, ingredient.id];
      onUpdate({ dislike_ids: newDislikes });
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setQuery("");
    setResults([]);
  };

  const removeDislike = (id: string) => {
    const newDislikes = dislikeIds.filter((did) => did !== id);
    onUpdate({ dislike_ids: newDislikes });
    setSelectedIngredients(selectedIngredients.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Any dislikes?</CardTitle>
        <CardDescription>Search for ingredients you don't like, and we'll avoid them in your recipes.</CardDescription>
      </CardHeader>

      <div className="relative space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ingredients (e.g., onions, mushrooms)..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          {isLoading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Search Results Dropdown */}
        {isFocused && results.length > 0 && (
          <div className="absolute z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
            <ul className="py-1">
              {results.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    dislikeIds.includes(ingredient.id) && "opacity-50 cursor-default"
                  )}
                  onClick={() => !dislikeIds.includes(ingredient.id) && addDislike(ingredient)}
                >
                  {ingredient.name}
                  {ingredient.category && (
                    <span className="ml-auto text-xs text-muted-foreground">{ingredient.category}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium leading-none">Selected Dislikes</h4>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {selectedIngredients.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No ingredients selected yet.</p>
          )}
          {selectedIngredients.map((ingredient) => (
            <Badge key={ingredient.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
              {ingredient.name}
              <button
                onClick={() => removeDislike(ingredient.id)}
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Remove {ingredient.name}</span>
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
