import * as React from "react";
import { Badge } from "@/components/ui/badge";

export interface UsageVM {
  remaining: number;
  limit: number;
}

export interface CreditCounterProps {
  usage: UsageVM | null;
  isLoading?: boolean;
}

export function CreditCounter({ usage, isLoading }: CreditCounterProps) {
  const text = isLoading ? "—/3" : usage ? `${usage.remaining}/${usage.limit}` : "—/3";
  const isLocked = !isLoading && usage?.remaining === 0;

  return (
    <Badge variant={isLocked ? "secondary" : "default"} aria-label="Pozostałe kredyty">
      {text}
    </Badge>
  );
}
