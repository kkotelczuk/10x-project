import * as React from "react";

import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const id = React.useId();

  return (
    <div className="w-full md:flex-1">
      <label htmlFor={id} className="sr-only">
        Wyszukaj przepisy
      </label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Szukaj po tytule..."
      />
    </div>
  );
}
