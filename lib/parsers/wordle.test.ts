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

describe("parseWordle", () => {
  it("parses a solved puzzle", () => {
    const result = parseWordle(SOLVED);
    expect(result).toEqual({
      game: "wordle",
      confidence: "high",
      puzzleNumber: 1234,
      score: 4,
      failed: false,
    });
  });

  it("parses a failed puzzle as worse than 6/6", () => {
    const result = parseWordle(FAILED);
    expect(result).toEqual({
      game: "wordle",
      confidence: "high",
      puzzleNumber: 1235,
      score: 7,
      failed: true,
    });
  });

  it("returns null for unrelated text", () => {
    expect(parseWordle("just some random text")).toBeNull();
  });

  it("detects wordle text", () => {
    expect(looksLikeWordle(SOLVED)).toBe(true);
    expect(looksLikeWordle("Connections\nPuzzle #1")).toBe(false);
  });
});
