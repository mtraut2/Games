import { looksLikeWordle, parseWordle } from "./wordle";
import { looksLikeConnections, parseConnections } from "./connections";
import { looksLikeStrands, parseStrands } from "./strands";
import type { ParsedResult } from "./types";

export * from "./types";
export { parseWordle } from "./wordle";
export { parseConnections } from "./connections";
export { parseStrands } from "./strands";

/**
 * Detects which game a pasted share-text is from and parses it.
 * Returns null when nothing recognizable is found (caller should fall
 * back to manual entry).
 */
export function detectAndParse(text: string): ParsedResult | null {
  if (looksLikeWordle(text)) return parseWordle(text);
  if (looksLikeConnections(text)) return parseConnections(text);
  if (looksLikeStrands(text)) return parseStrands(text);
  return null;
}
