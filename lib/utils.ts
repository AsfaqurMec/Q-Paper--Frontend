import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractChapterNumber(name: string): number {
  if (!name) return 9999;
  const banglaDigits: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const normalized = name.replace(/[০-৯]/g, (d) => banglaDigits[d] || d);
  const match = normalized.match(/(?:অধ্যায়|অধ্যায়|chapter|ch)\s*[:.\-]?\s*(\d+)/i) || normalized.match(/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 9999;
}
export function toStandardDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  const banglaDigits: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (d) => banglaDigits[d] || d);
}

export function parseNumberInput(value: string | number | undefined | null, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = toStandardDigits(value);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? fallback : parsed;
}
