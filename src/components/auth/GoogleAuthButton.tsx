import { Button } from "@/components/ui/button";

interface GoogleAuthButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
}

export function GoogleAuthButton({ onClick, isLoading = false, label = "Kontynuuj z Google" }: GoogleAuthButtonProps) {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={isLoading}>
      <span className="inline-flex items-center gap-2">
        <span className="text-base">G</span>
        {isLoading ? "Łączenie..." : label}
      </span>
    </Button>
  );
}
