import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface ProfileWizardCardProps {
  children: ReactNode;
}

export function ProfileWizardCard({ children }: ProfileWizardCardProps) {
  return (
    <Card>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}
