import type { ParsedWordle } from "./types";

const WORDLE_HEADER = /Wordle\s*(?:\.?\s*[A-Za-z]*)?\s*#?([\d,]+)\s+([1-6Xx])\/6/;

export function looksLikeWordle(text: string): boolean {
  return /wordle/i.test(text) && WORDLE_HEADER.test(text);
}

export function parseWordle(text: string): ParsedWordle | null {
  const match = text.match(WORDLE_HEADER);
  if (!match) return null;

  const puzzleNumber = parseInt(match[1].replace(/,/g, ""), 10);
  const scoreToken = match[2].toUpperCase();
  const failed = scoreToken === "X";
  const score = failed ? 7 : parseInt(scoreToken, 10);

  return {
    game: "wordle",
    confidence: "high",
    puzzleNumber: Number.isFinite(puzzleNumber) ? puzzleNumber : null,
    score,
    failed,
  };
}
