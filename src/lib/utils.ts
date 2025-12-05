import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidCveId(id: string): boolean {
  return /^CVE-\d{4}-\d{4,}$/i.test(id);
}
