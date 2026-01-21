import * as React from "react";

import type { PasswordStrength } from "@/types";

const MIN_LENGTH = 8;

const getStrengthLabel = (score: number): PasswordStrength["label"] => {
  if (score <= 1) return "słabe";
  if (score <= 3) return "średnie";
  return "mocne";
};

export function usePasswordStrength(password: string): PasswordStrength {
  return React.useMemo(() => {
    const minLength = password.length >= MIN_LENGTH;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasLetter = /[A-Za-z]/.test(password);

    const score = Math.min(
      4,
      [minLength, hasNumber, hasSpecial, hasLetter].filter(Boolean).length
    ) as PasswordStrength["score"];

    return {
      score,
      label: getStrengthLabel(score),
      requirements: {
        minLength,
        hasNumber,
        hasSpecial,
      },
    };
  }, [password]);
}
