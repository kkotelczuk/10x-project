import { LockIcon, SparklesIcon } from "lucide-react";

import type { UsageQuotaViewModel } from "@/types";
import { Button } from "@/components/ui/button";

interface MobileFabProps {
  usage: UsageQuotaViewModel | null;
  onClick: () => void;
}

export function MobileFab({ usage, onClick }: MobileFabProps) {
  const isLimitReached = usage?.isLimitReached ?? false;

  return (
    <div className="fixed bottom-6 right-6 z-40 md:hidden">
      <Button
        type="button"
        size="lg"
        className="rounded-full shadow-lg"
        disabled={isLimitReached}
        onClick={onClick}
        aria-label={isLimitReached ? "Limit wyczerpany" : "Generuj przepis"}
      >
        {isLimitReached ? <LockIcon className="size-5" /> : <SparklesIcon className="size-5" />}
      </Button>
    </div>
  );
}
