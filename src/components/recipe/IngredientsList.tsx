import type { RecipeIngredientJson } from "@/types";

interface IngredientsListProps {
  ingredients: RecipeIngredientJson[];
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  if (!ingredients || ingredients.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak składników.</p>;
  }

  return (
    <ul className="grid gap-2 text-sm">
      {ingredients.map((ingredient, index) => (
        <li key={index} className="flex items-start gap-2">
          <div className="h-1.5 w-1.5 translate-y-2 rounded-full bg-primary shrink-0" />
          <span>
            {ingredient.amount && <span className="font-semibold">{ingredient.amount} </span>}
            {ingredient.unit && <span className="text-muted-foreground">{ingredient.unit} </span>}
            <span>{ingredient.item}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
