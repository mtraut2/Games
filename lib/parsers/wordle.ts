import type { ParsedWordle } from "./types";

const WORDLE_HEADER = /Wordle\s*(?:\.?\s*[A-Za-z]*)?\s*#?([\d,]+)\s+([1-6Xx])\/6/;

// Both the default and colorblind-accessible tile palettes — 🟦 means
// "correct position" in colorblind mode, the same as 🟩 in the default one.
const TILE_EMOJI = new Set(["⬛", "⬜", "🟨", "🟩", "🟧", "🟦"]);
const GREEN_EQUIVALENT = new Set(["🟩", "🟦"]);

export function looksLikeWordle(text: string): boolean {
  return /wordle/i.test(text) && WORDLE_HEADER.test(text);
}

/** 1-indexed guess row of the first green (or colorblind-blue) tile, if the grid was pasted. */
function findFirstGreenGuess(text: string): number | null {
  let guessNumber = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tiles = Array.from(trimmed);
    if (tiles.length !== 5 || !tiles.every((t) => TILE_EMOJI.has(t))) continue;
    guessNumber += 1;
    if (tiles.some((t) => GREEN_EQUIVALENT.has(t))) return guessNumber;
  }
  return null;
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
    firstGreenGuess: findFirstGreenGuess(text),
  };
}
