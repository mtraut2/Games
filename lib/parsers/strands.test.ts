import { describe, expect, it } from "vitest";
import { looksLikeStrands, parseStrands } from "./strands";

// A real Strands share: the emoji block word-wraps at some width, but each
// individual emoji is one found word in order — row breaks are NOT word
// boundaries.
const REAL_EXAMPLE = `Strands #909
"Now we're cooking!"
🔵🔵🟡🔵
🔵🔵🔵`;

const WITH_HINTS = `Strands #124
"Cross the finish line"
💡🔵🔵🟡
🔵💡🔵🔵`;

const AMBIGUOUS = `Strands #125
"Mystery"
🔵🔵🔵🔵
🟡🟢`;

describe("parseStrands", () => {
  it("parses a real share where the emoji block wraps across lines", () => {
    const result = parseStrands(REAL_EXAMPLE);
    expect(result).toEqual({
      game: "strands",
      confidence: "high",
      puzzleNumber: 909,
      score: 0,
      spangramPosition: 3, // 3rd emoji in the flattened sequence
      needsSpangramConfirmation: false,
      totalFoundWords: 7,
    });
  });

  it("counts hints embedded anywhere in the sequence, not just standalone rows", () => {
    const result = parseStrands(WITH_HINTS);
    expect(result).toEqual({
      game: "strands",
      confidence: "high",
      puzzleNumber: 124,
      score: 2,
      spangramPosition: 3, // 3rd non-hint emoji
      needsSpangramConfirmation: false,
      totalFoundWords: 6,
    });
  });

  it("flags low confidence when the spangram can't be determined", () => {
    const result = parseStrands(AMBIGUOUS);
    expect(result?.needsSpangramConfirmation).toBe(true);
    expect(result?.confidence).toBe("low");
    expect(result?.spangramPosition).toBeNull();
    expect(result?.totalFoundWords).toBe(6);
  });

  it("returns null for unrelated text", () => {
    expect(parseStrands("nothing here")).toBeNull();
  });

  it("detects strands text", () => {
    expect(looksLikeStrands(REAL_EXAMPLE)).toBe(true);
    expect(looksLikeStrands("Wordle 1 4/6")).toBe(false);
  });
});
