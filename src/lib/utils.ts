import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the value from a PostgREST style equality filter (e.g., "eq.value").
 * Returns the value if the format matches, otherwise returns undefined.
 */
export function parseEqFilter(param: string | null | undefined): string | undefined {
  if (!param) return undefined;
  if (param.startsWith("eq.")) {
    return param.slice(3);
  }
  return undefined;
}

/**
 * Extracts the value from a PostgREST style ilike filter (e.g., "ilike.*value*").
 * Removes the "ilike." prefix and surrounding wildcards (*).
 * Returns the cleaned value if the format matches, otherwise returns undefined.
 */
export function parseIlikeFilter(param: string | null | undefined): string | undefined {
  if (!param) return undefined;
  if (param.startsWith("ilike.")) {
    // Remove "ilike." prefix
    let value = param.slice(6);
    // Remove leading asterisk
    if (value.startsWith("*")) {
      value = value.slice(1);
    }
    // Remove trailing asterisk
    if (value.endsWith("*")) {
      value = value.slice(0, -1);
    }
    return value;
  }
  return undefined;
}
