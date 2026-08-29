import { describe, expect, it } from "vitest";
import { looksLikeConnections, parseConnections } from "./connections";

const WITH_ONE_MISTAKE = `Connections
Puzzle #245
🟨🟨🟨🟨
🟩🟦🟩🟩
🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪`;

const PERFECT = `Connections
Puzzle #246
🟨🟨🟨🟨
🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪`;

describe("parseConnections", () => {
  it("counts mistakes and captures solve order", () => {
    const result = parseConnections(WITH_ONE_MISTAKE);
    expect(result).toEqual({
      game: "connections",
      confidence: "high",
      puzzleNumber: 245,
      score: 1,
      solveOrder: ["yellow", "green", "blue", "purple"],
    });
  });

  it("handles a perfect game with zero mistakes", () => {
    const result = parseConnections(PERFECT);
    expect(result?.score).toBe(0);
    expect(result?.solveOrder).toEqual(["yellow", "green", "blue", "purple"]);
    expect(result?.confidence).toBe("high");
  });

  it("returns null for unrelated text", () => {
    expect(parseConnections("nothing here")).toBeNull();
  });

  it("detects connections text", () => {
    expect(looksLikeConnections(PERFECT)).toBe(true);
    expect(looksLikeConnections("Wordle 1 4/6")).toBe(false);
  });
});
