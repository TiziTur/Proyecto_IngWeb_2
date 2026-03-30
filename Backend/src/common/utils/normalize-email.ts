/**
 * Shared email normalisation utility.
 * Trims whitespace and lowercases the address so comparisons are
 * consistent regardless of how the caller typed it.
 */
export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}
