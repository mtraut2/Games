import { describe, expect, it } from "vitest";
import { looksLikeWordle, parseWordle } from "./wordle";

const SOLVED = `Wordle 1,234 4/6

⬛🟨⬛⬛⬛
⬛⬛🟩⬛🟨
⬛🟩🟩🟩🟩
🟩🟩🟩🟩🟩`;

const FAILED = `Wordle 1,235 X/6

⬛⬛⬛⬛⬛
⬛⬛⬛⬛⬛
⬛⬛⬛⬛⬛
⬛⬛⬛⬛⬛
⬛⬛⬛⬛⬛
⬛⬛⬛⬛⬛`;

const NO_GRID = "Wordle 1,236 3/6";

const COLORBLIND = `Wordle 1,237 3/6

⬛🟧⬛⬛⬛
⬛⬛🟦⬛🟧
🟦🟦🟦🟦🟦`;

describe("parseWordle", () => {
  it("parses a solved puzzle and finds the first green guess", () => {
    const result = parseWordle(SOLVED);
    expect(result).toEqual({
      game: "wordle",
      confidence: "high",
      puzzleNumber: 1234,
      score: 4,
      failed: false,
      firstGreenGuess: 2, // row 1 has no green, row 2 does
    });
  });

  it("parses a failed puzzle as worse than 6/6, with no green tile at all", () => {
    const result = parseWordle(FAILED);
    expect(result).toEqual({
      game: "wordle",
      confidence: "high",
      puzzleNumber: 1235,
      score: 7,
      failed: true,
      firstGreenGuess: null,
    });
  });

  it("leaves firstGreenGuess null when no grid was pasted", () => {
    const result = parseWordle(NO_GRID);
    expect(result?.firstGreenGuess).toBeNull();
  });

  it("recognizes colorblind-mode tiles (🟦) as green-equivalent", () => {
    const result = parseWordle(COLORBLIND);
    expect(result?.firstGreenGuess).toBe(2);
  });

  it("returns null for unrelated text", () => {
    expect(parseWordle("just some random text")).toBeNull();
  });

  it("detects wordle text", () => {
    expect(looksLikeWordle(SOLVED)).toBe(true);
    expect(looksLikeWordle("Connections\nPuzzle #1")).toBe(false);
  });
});
