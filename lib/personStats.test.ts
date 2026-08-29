import { describe, expect, it } from "vitest";
import type { Result } from "./types";
import { computeConnectionsStats, computeStrandsStats, computeWordleStats } from "./personStats";

let counter = 0;
function makeResult(overrides: Partial<Result>): Result {
  counter += 1;
  return {
    id: `r-${counter}`,
    person_id: "a",
    game: "wordle",
    date: "2026-08-01",
    puzzle_number: 1,
    score: 3,
    failed: false,
    raw_text: "",
    solve_order: null,
    spangram_position: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("computeWordleStats", () => {
  it("averages only solved games and tracks fails separately", () => {
    const results = [
      makeResult({ score: 2 }),
      makeResult({ score: 4 }),
      makeResult({ score: 7, failed: true }),
    ];
    const stats = computeWordleStats(results);
    expect(stats.played).toBe(3);
    expect(stats.avgGuesses).toBe(3); // (2+4)/2
    expect(stats.failCount).toBe(1);
    expect(stats.winPct).toBeCloseTo((2 / 3) * 100);
  });

  it("returns null averages instead of NaN when nobody has played", () => {
    const stats = computeWordleStats([]);
    expect(stats.played).toBe(0);
    expect(stats.avgGuesses).toBeNull();
    expect(stats.winPct).toBe(0);
    expect(stats.bestPuzzle).toBeNull();
    expect(stats.worstPuzzle).toBeNull();
  });
});

describe("computeConnectionsStats", () => {
  it("tallies solve position counts per color", () => {
    const results = [
      makeResult({ game: "connections", score: 0, solve_order: ["yellow", "green", "blue", "purple"] }),
      makeResult({ game: "connections", score: 1, solve_order: ["green", "yellow", "blue", "purple"] }),
    ];
    const stats = computeConnectionsStats(results);
    expect(stats.perfectPct).toBe(50);
    expect(stats.solveOrderByColor.yellow).toEqual([1, 1, 0, 0]);
    expect(stats.solveOrderByColor.green).toEqual([1, 1, 0, 0]);
  });

  it("returns null average and zeroed chart data when nobody has played", () => {
    const stats = computeConnectionsStats([]);
    expect(stats.played).toBe(0);
    expect(stats.avgMistakes).toBeNull();
    expect(stats.perfectPct).toBe(0);
    expect(stats.solveOrderByColor.purple).toEqual([0, 0, 0, 0]);
  });
});

describe("computeStrandsStats", () => {
  it("computes spangram-first rate and average position", () => {
    const results = [
      makeResult({ game: "strands", score: 0, spangram_position: 1 }),
      makeResult({ game: "strands", score: 1, spangram_position: 3 }),
    ];
    const stats = computeStrandsStats(results);
    expect(stats.spangramFirstPct).toBe(50);
    expect(stats.avgSpangramPosition).toBe(2);
    expect(stats.hintFreePct).toBe(50);
  });

  it("returns null averages when nobody has played", () => {
    const stats = computeStrandsStats([]);
    expect(stats.played).toBe(0);
    expect(stats.avgHints).toBeNull();
    expect(stats.avgSpangramPosition).toBeNull();
    expect(stats.hintFreePct).toBe(0);
    expect(stats.spangramFirstPct).toBe(0);
  });

  it("excludes results with no recorded spangram position from the spangram stats", () => {
    const results = [
      makeResult({ game: "strands", score: 1, spangram_position: null }),
      makeResult({ game: "strands", score: 2, spangram_position: null }),
    ];
    const stats = computeStrandsStats(results);
    expect(stats.played).toBe(2); // still counted as played
    expect(stats.avgHints).toBe(1.5); // hints stat is unaffected
    expect(stats.spangramFirstPct).toBe(0);
    expect(stats.avgSpangramPosition).toBeNull();
  });
});
