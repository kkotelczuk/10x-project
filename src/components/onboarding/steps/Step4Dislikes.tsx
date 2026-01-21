import React, { useEffect, useMemo, useState } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Loader2 } from "lucide-react";
import type { IngredientDTO } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

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
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchIngredients(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const selectedIngredientsMap = useMemo(() => {
    return new Map(selectedIngredients.map((ingredient) => [ingredient.id, ingredient]));
  }, [selectedIngredients]);

  useEffect(() => {
    if (dislikeIds.length === 0) {
      setSelectedIngredients([]);
      return;
    }

    const missingIds = dislikeIds.filter((id) => !selectedIngredientsMap.has(id));
    if (missingIds.length === 0) return;

    const controller = new AbortController();

    const fetchMissingIngredients = async () => {
      try {
        const url = new URL("/rest/v1/ingredients", window.location.origin);
        url.searchParams.set("select", "id,name,category,variants");
        url.searchParams.set("id", `in.(${missingIds.join(",")})`);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as IngredientDTO[];
        const normalized = Array.isArray(data) ? data : [];
        setSelectedIngredients((prev) => {
          const existing = new Map(prev.map((item) => [item.id, item]));
          normalized.forEach((item) => existing.set(item.id, item));
          return Array.from(existing.values()).filter((item) => dislikeIds.includes(item.id));
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        logger.error("Failed to preload disliked ingredients", error);
      }
    };

    fetchMissingIngredients();

    return () => controller.abort();
  }, [dislikeIds, selectedIngredientsMap]);

  const searchIngredients = async (searchQuery: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/rest/v1/ingredients?query=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!response.ok) {
        throw new Error("Request failed");
      }
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Failed to search ingredients", error);
      toast.info("Nie udało się pobrać wyników wyszukiwania.");
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
        <CardDescription>
          Search for ingredients you don&apos;t like, and we&apos;ll avoid them in your recipes.
        </CardDescription>
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
              {results.map((ingredient) => {
                const isDisabled = dislikeIds.includes(ingredient.id);
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      className={cn(
                        "relative flex w-full select-none items-center px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                        isDisabled && "opacity-50 cursor-default"
                      )}
                      onClick={() => addDislike(ingredient)}
                    >
                      <span>{ingredient.name}</span>
                      {ingredient.category && (
                        <span className="ml-auto text-xs text-muted-foreground">{ingredient.category}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {isFocused && hasSearched && results.length === 0 && !isLoading ? (
          <div className="absolute z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2 text-sm text-muted-foreground">
            Brak wyników wyszukiwania.
          </div>
        ) : null}
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
