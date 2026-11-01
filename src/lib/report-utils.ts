/** Normalizes a sender/number so "01712-345678", "+880 1712345678" and
 * "01712345678" all match the same report bucket. */
export function normalizeIdentifier(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\+?880/, "0")
    .replace(/[^a-z0-9]/g, "");
}
