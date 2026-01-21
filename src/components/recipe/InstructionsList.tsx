import type { RecipeInstructionJson } from "@/types";

interface InstructionsListProps {
  instructions: RecipeInstructionJson[];
}

export function InstructionsList({ instructions }: InstructionsListProps) {
  if (!instructions || instructions.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak instrukcji.</p>;
  }

  // Ensure steps are sorted
  const sortedInstructions = [...instructions].sort((a, b) => a.step - b.step);

  return (
    <ol className="space-y-4">
      {sortedInstructions.map((instruction) => (
        <li key={instruction.step} className="flex gap-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-bold text-primary">
            {instruction.step}
          </span>
          <p className="text-sm leading-6 text-foreground">{instruction.text}</p>
        </li>
      ))}
    </ol>
  );
}
