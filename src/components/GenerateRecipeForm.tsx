import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GenerateRecipeResponse } from "@/types";
import { logger } from "@/lib/logger";

interface GenerateRecipeFormProps {
  onSuccess?: (recipe: GenerateRecipeResponse["recipe"]) => void;
}

export const GenerateRecipeForm: React.FC<GenerateRecipeFormProps> = ({ onSuccess }) => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ original_text: inputText }),
      });

      // We need to handle both success (GenerateRecipeResponse) and error responses ({ error: string })
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        // Handle specific error codes
        if (response.status === 429) {
          throw new Error("Dzienny limit generowania przepisów został wykorzystany. Spróbuj ponownie jutro.");
        } else if (response.status === 401) {
          throw new Error("Musisz być zalogowany, aby generować przepisy.");
        } else if (response.status === 422 || response.status === 400) {
          throw new Error(
            errorData.error || "Nie udało się wygenerować przepisu z podanego tekstu. Spróbuj opisać go inaczej."
          );
        } else {
          throw new Error(errorData.error || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
        }
      }

      const successData = data as GenerateRecipeResponse;

      // Success
      setInputText("");
      if (onSuccess) {
        onSuccess(successData.recipe);
      }
    } catch (err: unknown) {
      logger.error("Generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas komunikacji z serwerem.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="recipe-input"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Na co masz ochotę?
          </label>
          <textarea
            id="recipe-input"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Np. szybki obiad z kurczakiem i ryżem, bez glutenu..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{inputText.length}/1000</p>
        </div>

        {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>}

        <Button type="submit" disabled={loading || !inputText.trim()} className="w-full">
          {loading ? "Generowanie..." : "Generuj Przepis"}
        </Button>
      </form>
    </div>
  );
};
