import type { ParsedStrands } from "./types";

const HINT_EMOJI = "💡";
const PUZZLE_NUMBER = /Strands\s*#?([\d,]+)/i;

/**
 * Real Strands share text is a header line, a quoted theme-name line, then
 * a block of emoji that word-wraps at some width — e.g.:
 *   Strands #909
 *   "Now we're cooking!"
 *   🔵🔵🟡🔵
 *   🔵🔵🔵
 * The line breaks inside that block are just wrapping, not word
 * boundaries: each individual emoji is one found word (or hint) in the
 * order it happened, not each row. So we flatten every emoji-only line
 * into a single chronological sequence.
 */
function extractEmojiSequence(text: string): string[] {
  const chars: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lineChars = Array.from(trimmed);
    // Only lines made entirely of emoji — skips the "Strands #123" header
    // and the quoted theme-name line, without assuming which emoji are used.
    const isEmojiLine = lineChars.every((c) => /\p{Extended_Pictographic}/u.test(c));
    if (isEmojiLine) chars.push(...lineChars);
  }
  return chars;
}

export function looksLikeStrands(text: string): boolean {
  return /strands/i.test(text) && extractEmojiSequence(text).length > 0;
}

export function parseStrands(text: string): ParsedStrands | null {
  const puzzleMatch = text.match(PUZZLE_NUMBER);
  const puzzleNumber = puzzleMatch
    ? parseInt(puzzleMatch[1].replace(/,/g, ""), 10)
    : null;

  const sequence = extractEmojiSequence(text);
  if (sequence.length === 0) return null;

  // 💡 is a soft assumption for "hint used", not hardcoded as the only
  // possible marker — but it's what NYT uses today, so count it globally.
  const hints = sequence.filter((c) => c === HINT_EMOJI).length;
  const foundWords = sequence.filter((c) => c !== HINT_EMOJI);

  const countByEmoji = new Map<string, number>();
  for (const emoji of foundWords) {
    countByEmoji.set(emoji, (countByEmoji.get(emoji) ?? 0) + 1);
  }

  // Theme-word color = whichever emoji covers the most found words.
  let themeEmoji: string | null = null;
  let themeCount = 0;
  for (const [emoji, count] of countByEmoji) {
    if (count > themeCount) {
      themeEmoji = emoji;
      themeCount = count;
    }
  }

  // Spangram = an emoji distinct from the theme color that appears exactly once.
  const singleEmojis = [...countByEmoji.entries()]
    .filter(([emoji, count]) => count === 1 && emoji !== themeEmoji)
    .map(([emoji]) => emoji);

  let spangramPosition: number | null = null;
  let needsSpangramConfirmation = true;

  if (themeEmoji && singleEmojis.length === 1) {
    spangramPosition = foundWords.indexOf(singleEmojis[0]) + 1;
    needsSpangramConfirmation = false;
  }

  return {
    game: "strands",
    confidence: needsSpangramConfirmation ? "low" : "high",
    puzzleNumber: puzzleNumber !== null && Number.isFinite(puzzleNumber) ? puzzleNumber : null,
    score: hints,
    spangramPosition,
    needsSpangramConfirmation,
    totalFoundWords: foundWords.length,
  };
}
