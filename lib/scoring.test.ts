import { describe, expect, it } from "vitest";
import type { Result } from "./types";
import {
  computeDailyGameStandings,
  computeDailyOverallWinners,
  computeSeasonStandings,
  dailyGameWinners,
} from "./scoring";

let counter = 0;
function makeResult(overrides: Partial<Result>): Result {
  counter += 1;
  return {
    id: `result-${counter}`,
    person_id: "person-a",
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

describe("computeDailyGameStandings", () => {
  it("awards 3/2/1 with no ties", () => {
    const results = [
      makeResult({ person_id: "a", score: 2 }),
      makeResult({ person_id: "b", score: 3 }),
      makeResult({ person_id: "c", score: 4 }),
      makeResult({ person_id: "d", score: 5 }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(3);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2);
    expect(standings.find((s) => s.personId === "c")?.points).toBe(1);
    expect(standings.find((s) => s.personId === "d")?.points).toBe(0);
  });

  it("pools and averages points for a 1st/2nd tie", () => {
    const results = [
      makeResult({ person_id: "a", score: 2 }),
      makeResult({ person_id: "b", score: 2 }),
      makeResult({ person_id: "c", score: 4 }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(2.5);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2.5);
    // c is bumped to 3rd place (ranks 1-2 consumed by the tie)
    expect(standings.find((s) => s.personId === "c")?.points).toBe(1);
  });

  it("pools and averages a three-way tie for 1st/2nd/3rd", () => {
    const results = [
      makeResult({ person_id: "a", score: 2 }),
      makeResult({ person_id: "b", score: 2 }),
      makeResult({ person_id: "c", score: 2 }),
    ];
    const standings = computeDailyGameStandings(results);
    for (const s of standings) expect(s.points).toBe(2); // (3+2+1)/3
  });

  it("breaks a Connections mistake-tie by who solved harder categories earlier", () => {
    const results = [
      // same mistake count, but a solved the hardest (purple) category first
      makeResult({
        person_id: "a",
        game: "connections",
        score: 1,
        solve_order: ["purple", "blue", "green", "yellow"],
      }),
      makeResult({
        person_id: "b",
        game: "connections",
        score: 1,
        solve_order: ["yellow", "green", "blue", "purple"],
      }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(3);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2);
  });

  it("still splits points when Connections mistakes and solve order both match", () => {
    const order: Result["solve_order"] = ["yellow", "green", "blue", "purple"];
    const results = [
      makeResult({ person_id: "a", game: "connections", score: 0, solve_order: order }),
      makeResult({ person_id: "b", game: "connections", score: 0, solve_order: order }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(2.5);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2.5);
  });

  it("weighs a partial solve order against a fixed 4-category scale, not its own length", () => {
    const results = [
      // "weak" but complete order: easy categories solved first
      makeResult({
        person_id: "a",
        game: "connections",
        score: 1,
        solve_order: ["yellow", "green", "blue", "purple"],
      }),
      // partial order (e.g. left blank via manual entry) — but the two
      // known solves are the two hardest categories, so this is stronger
      // play than a's, despite having less data.
      makeResult({ person_id: "b", game: "connections", score: 1, solve_order: ["purple", "blue"] }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(3);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(2);
  });

  it("treats missing Connections solve order as the tiebreak loser", () => {
    const results = [
      makeResult({
        person_id: "a",
        game: "connections",
        score: 1,
        solve_order: ["yellow", "green", "blue", "purple"],
      }),
      makeResult({ person_id: "b", game: "connections", score: 1, solve_order: null }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(3);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2);
  });

  it("breaks a Strands hint-tie by who found the spangram earlier", () => {
    const results = [
      makeResult({ person_id: "a", game: "strands", score: 1, spangram_position: 1 }),
      makeResult({ person_id: "b", game: "strands", score: 1, spangram_position: 4 }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(3);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2);
  });

  it("does not apply a tiebreaker across different Wordle scores (no secondary signal)", () => {
    const results = [
      makeResult({ person_id: "a", game: "wordle", score: 3 }),
      makeResult({ person_id: "b", game: "wordle", score: 3 }),
    ];
    const standings = computeDailyGameStandings(results);
    expect(standings.find((s) => s.personId === "a")?.points).toBe(2.5);
    expect(standings.find((s) => s.personId === "b")?.points).toBe(2.5);
  });
});

describe("dailyGameWinners", () => {
  it("returns only the tiebreak winner, not everyone tied on raw score", () => {
    const results = [
      makeResult({
        person_id: "a",
        game: "connections",
        score: 1,
        solve_order: ["purple", "blue", "green", "yellow"],
      }),
      makeResult({
        person_id: "b",
        game: "connections",
        score: 1,
        solve_order: ["yellow", "green", "blue", "purple"],
      }),
    ];
    expect(dailyGameWinners(results)).toEqual(["a"]);
  });

  it("returns everyone still tied after the tiebreaker", () => {
    const results = [
      makeResult({ person_id: "a", game: "wordle", score: 2 }),
      makeResult({ person_id: "b", game: "wordle", score: 2 }),
    ];
    expect(dailyGameWinners(results).sort()).toEqual(["a", "b"]);
  });
});

describe("computeDailyOverallWinners", () => {
  it("only considers people who played all three games", () => {
    const results = [
      makeResult({ person_id: "a", game: "wordle", score: 2 }),
      makeResult({ person_id: "a", game: "connections", score: 1 }),
      makeResult({ person_id: "a", game: "strands", score: 0 }),
      // b only played wordle
      makeResult({ person_id: "b", game: "wordle", score: 1 }),
    ];
    const winners = computeDailyOverallWinners(results);
    expect(winners).toHaveLength(1);
    expect(winners[0].personId).toBe("a");
    expect(winners[0].totalScore).toBe(3);
    expect(winners[0].bonusPoints).toBe(2);
  });

  it("splits the bonus when two people tie for the lowest sum", () => {
    const results = [
      makeResult({ person_id: "a", game: "wordle", score: 2 }),
      makeResult({ person_id: "a", game: "connections", score: 1 }),
      makeResult({ person_id: "a", game: "strands", score: 0 }),
      makeResult({ person_id: "b", game: "wordle", score: 1 }),
      makeResult({ person_id: "b", game: "connections", score: 1 }),
      makeResult({ person_id: "b", game: "strands", score: 1 }),
    ];
    const winners = computeDailyOverallWinners(results);
    expect(winners).toHaveLength(2);
    for (const w of winners) expect(w.bonusPoints).toBe(1);
  });

  it("returns no winners when nobody completed all three games", () => {
    const results = [makeResult({ person_id: "a", game: "wordle", score: 2 })];
    expect(computeDailyOverallWinners(results)).toEqual([]);
  });
});

describe("computeSeasonStandings", () => {
  it("aggregates game points and bonus points across days", () => {
    const results = [
      // day 1: a wins wordle outright
      makeResult({ person_id: "a", game: "wordle", date: "2026-08-01", score: 2 }),
      makeResult({ person_id: "b", game: "wordle", date: "2026-08-01", score: 4 }),
      // day 2: a sweeps all three games and wins overall bonus too
      makeResult({ person_id: "a", game: "wordle", date: "2026-08-02", score: 1 }),
      makeResult({ person_id: "a", game: "connections", date: "2026-08-02", score: 0 }),
      makeResult({ person_id: "a", game: "strands", date: "2026-08-02", score: 0 }),
      makeResult({ person_id: "b", game: "wordle", date: "2026-08-02", score: 5 }),
    ];
    const standings = computeSeasonStandings(results);
    const a = standings.find((s) => s.personId === "a")!;
    // day1: wordle win = 3. day2: wordle win = 3, plus connections/strands
    // where a is the only entrant (solo win still counts) = 3 + 3.
    // 3 + 3 + 3 + 3 = 12 game points, +2 overall-winner bonus on day2.
    expect(a.gamePoints).toBe(12);
    expect(a.bonusPoints).toBe(2);
    expect(a.totalPoints).toBe(14);
  });

  it("breaks down points per game so a single-game player can be ranked on it", () => {
    const results = [
      // a only ever plays Wordle; b plays both
      makeResult({ person_id: "a", game: "wordle", date: "2026-08-01", score: 2 }),
      makeResult({ person_id: "b", game: "wordle", date: "2026-08-01", score: 4 }),
      makeResult({ person_id: "b", game: "connections", date: "2026-08-01", score: 0 }),
    ];
    const standings = computeSeasonStandings(results);
    const a = standings.find((s) => s.personId === "a")!;
    const b = standings.find((s) => s.personId === "b")!;
    expect(a.byGame).toEqual({ wordle: 3, connections: 0, strands: 0 });
    // b scored worse than a in Wordle (2nd place = 2pts) but solo-played Connections (3pts)
    expect(b.byGame).toEqual({ wordle: 2, connections: 3, strands: 0 });
  });
});
