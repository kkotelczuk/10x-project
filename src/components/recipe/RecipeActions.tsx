import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteRecipeDialog } from "@/components/recipe/DeleteRecipeDialog";
import type { RecipeIngredientJson, RecipeInstructionJson } from "@/types";

export interface RecipeActionsProps {
  recipeId: string;
  recipeTitle: string;
  ingredients: RecipeIngredientJson[];
  instructions: RecipeInstructionJson[];
}

function formatRecipeForClipboard(input: {
  title: string;
  ingredients: RecipeIngredientJson[];
  instructions: RecipeInstructionJson[];
}): string {
  const ingredientsLines =
    input.ingredients.length === 0
      ? ["- (none)"]
      : input.ingredients.map((i) => {
          const amount = i.amount !== undefined && i.amount !== null ? String(i.amount).trim() : "";
          const unit = i.unit ? String(i.unit).trim() : "";
          const item = i.item ? String(i.item).trim() : "";
          const prefix = [amount, unit].filter(Boolean).join(" ");
          const line = prefix ? `${prefix} ${item}`.trim() : item;
          return `- ${line || "(unnamed)"}`;
        });

  const instructionsLines =
    input.instructions.length === 0
      ? ["1. (none)"]
      : input.instructions
          .slice()
          .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
          .map((s, idx) => {
            const number = s.step && s.step > 0 ? s.step : idx + 1;
            const text = String(s.text ?? "").trim() || "(empty)";
            return `${number}. ${text}`;
          });

  return [input.title, "", "Ingredients:", ...ingredientsLines, "", "Instructions:", ...instructionsLines, ""].join(
    "\n"
  );
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text.trim()) {
    throw new Error("There is nothing to copy.");
  }

  // Modern API
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.setAttribute("readonly", "true");
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!ok) {
    throw new Error("Could not copy to clipboard.");
  }
}

async function deleteRecipeById(id: string): Promise<void> {
  const url = new URL("/rest/v1/recipes", window.location.origin);
  url.searchParams.set("id", id);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) return;

  let message = "Failed to delete recipe. Please try again.";
  try {
    const body = (await response.json()) as { error?: string };
    if (body?.error) message = body.error;
  } catch {
    // ignore JSON parse errors
  }

  if (response.status === 401) message = "You are not authorized. Please sign in and try again.";
  if (response.status === 404) message = "Recipe not found.";

  throw new Error(message);
}

export default function RecipeActions({ recipeId, recipeTitle, ingredients, instructions }: RecipeActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const clipboardText = useMemo(
    () => formatRecipeForClipboard({ title: recipeTitle, ingredients, instructions }),
    [recipeTitle, ingredients, instructions]
  );

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(clipboardText);
      toast.success("Copied to clipboard.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Copy failed. Please try again.");
    }
  }, [clipboardText]);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    if (!recipeId) {
      toast.error("Missing recipe id.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRecipeById(recipeId);
      toast.success("Recipe deleted.");
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete recipe. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [isDeleting, recipeId]);

  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-end gap-2 px-4 py-3">
        <Button type="button" variant="outline" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <DeleteRecipeDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
