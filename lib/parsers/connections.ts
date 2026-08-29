import type { ConnectionsColor } from "@/lib/types";
import type { ParsedConnections } from "./types";

const COLOR_BY_EMOJI: Record<string, ConnectionsColor> = {
  "🟨": "yellow", // 🟨
  "🟩": "green", // 🟩
  "🟦": "blue", // 🟦
  "🟪": "purple", // 🟪
};

const PUZZLE_NUMBER = /Puzzle\s*#?([\d,]+)/i;

function extractEmojiRows(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Split into individual emoji code points (each of our 4 colors is one surrogate pair).
    const chars = Array.from(trimmed);
    if (chars.length === 4 && chars.every((c) => c in COLOR_BY_EMOJI)) {
      rows.push(chars);
    }
  }
  return rows;
}

export function looksLikeConnections(text: string): boolean {
  return /connections/i.test(text) && extractEmojiRows(text).length > 0;
}

export function parseConnections(text: string): ParsedConnections | null {
  const rows = extractEmojiRows(text);
  if (rows.length === 0) return null;

  const puzzleMatch = text.match(PUZZLE_NUMBER);
  const puzzleNumber = puzzleMatch
    ? parseInt(puzzleMatch[1].replace(/,/g, ""), 10)
    : null;

  const solveOrder: ConnectionsColor[] = [];
  let solvedRows = 0;
  for (const row of rows) {
    const uniqueColors = new Set(row.map((c) => COLOR_BY_EMOJI[c]));
    if (uniqueColors.size === 1) {
      solvedRows += 1;
      const color = COLOR_BY_EMOJI[row[0]];
      if (!solveOrder.includes(color)) solveOrder.push(color);
    }
  }

  const mistakes = rows.length - solvedRows;
  const confidence = solveOrder.length === 4 && mistakes >= 0 ? "high" : "low";

  return {
    game: "connections",
    confidence,
    puzzleNumber: puzzleNumber !== null && Number.isFinite(puzzleNumber) ? puzzleNumber : null,
    score: mistakes,
    solveOrder,
  };
}
