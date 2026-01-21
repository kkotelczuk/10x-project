import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FloatingActionButton() {
  return (
    <div className="fixed bottom-6 right-6 z-30 md:hidden">
      <Button
        type="button"
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label="Generuj przepis"
        onClick={() => {
          window.location.assign("/generate");
        }}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </Button>
    </div>
  );
}
