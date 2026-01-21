import * as React from "react";

import type { UsageQuotaViewModel } from "@/types";
import { useUsage } from "@/components/hooks/useUsage";

interface UseUsageQuotaResult {
  usage: UsageQuotaViewModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsageQuota(): UseUsageQuotaResult {
  const { usage, isLoading, error, refetch } = useUsage();

  const mapped = React.useMemo<UsageQuotaViewModel | null>(() => {
    if (!usage) return null;
    return {
      remaining: usage.remaining,
      limit: usage.limit,
      isLimitReached: usage.remaining <= 0,
    };
  }, [usage]);

  return { usage: mapped, isLoading, error, refetch };
}
