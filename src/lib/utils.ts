import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidCveId(id: string): boolean {
  return /^CVE-\d{4}-\d{4,}$/i.test(id);
}

export const sanitizeQueryInput = (value: string) =>
  value
    .replaceAll(/[^\w\s\-.:/"()&|<>=]/g, "")
    .replaceAll(/\s+/g, " ")
    .slice(0, 200);

export const sanitizeApiKeyInput = (value: string) =>
  value.replaceAll(/[^A-Za-z0-9\-_.]/g, "").slice(0, 128);
