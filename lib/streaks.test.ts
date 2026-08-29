import { describe, expect, it } from "vitest";
import type { Result, Skip } from "./types";
import {
  computeStreak,
  isSkipEligibleForDate,
  nextSkipEligibleDate,
  shouldPromptSkip,
} from "./streaks";

function makeResult(personId: string, date: string): Result {
  return {
    id: `${personId}-${date}`,
    person_id: personId,
    game: "wordle",
    date,
    puzzle_number: 1,
    score: 3,
    failed: false,
    raw_text: "",
    solve_order: null,
    spangram_position: null,
    created_at: "",
    updated_at: "",
  };
}

function makeSkip(personId: string, dateCovered: string, dateApplied: string): Skip {
  return {
    id: `${personId}-skip-${dateCovered}`,
    person_id: personId,
    date_covered: dateCovered,
    date_applied: dateApplied,
    created_at: "",
  };
}

describe("computeStreak", () => {
  it("counts a run of consecutive days", () => {
    const { current, longest } = computeStreak(
      ["2026-08-01", "2026-08-02", "2026-08-03"],
      "2026-08-03"
    );
    expect(current).toBe(3);
    expect(longest).toBe(3);
  });

  it("gives grace for today not yet played (most recent = yesterday)", () => {
    const { current } = computeStreak(["2026-08-01", "2026-08-02"], "2026-08-03");
    expect(current).toBe(2);
  });

  it("breaks the streak once 2+ days have been missed", () => {
    const { current, longest } = computeStreak(["2026-08-01", "2026-08-02"], "2026-08-04");
    expect(current).toBe(0);
    expect(longest).toBe(2);
  });

  it("tracks longest separately from current after a gap", () => {
    const { current, longest } = computeStreak(
      ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-10"],
      "2026-08-10"
    );
    expect(current).toBe(1);
    expect(longest).toBe(3);
  });
});

describe("skip eligibility", () => {
  it("allows a skip for today or yesterday, not further back", () => {
    expect(isSkipEligibleForDate([], "a", "2026-08-10", "2026-08-10")).toBe(true);
    expect(isSkipEligibleForDate([], "a", "2026-08-09", "2026-08-10")).toBe(true);
    expect(isSkipEligibleForDate([], "a", "2026-08-08", "2026-08-10")).toBe(false);
  });

  it("enforces a rolling 30-day cooldown from the last skip's covered date", () => {
    const skips = [makeSkip("a", "2026-08-01", "2026-08-01")];
    // 30 days later (Aug 31) should be eligible again, per the spec's example
    expect(isSkipEligibleForDate(skips, "a", "2026-08-31", "2026-08-31")).toBe(true);
    expect(isSkipEligibleForDate(skips, "a", "2026-08-30", "2026-08-30")).toBe(false);
  });

  it("reports the next eligible date", () => {
    const skips = [makeSkip("a", "2026-08-01", "2026-08-01")];
    expect(nextSkipEligibleDate(skips, "a")).toBe("2026-08-31");
    expect(nextSkipEligibleDate([], "a")).toBeNull();
  });
});

describe("shouldPromptSkip", () => {
  it("prompts when yesterday was missed and a skip is available", () => {
    const results = [makeResult("a", "2026-08-08")];
    expect(shouldPromptSkip(results, [], "a", "2026-08-10")).toBe(true);
  });

  it("does not prompt when yesterday was already played", () => {
    const results = [makeResult("a", "2026-08-09")];
    expect(shouldPromptSkip(results, [], "a", "2026-08-10")).toBe(false);
  });

  it("does not prompt a brand-new person with no play history at all", () => {
    expect(shouldPromptSkip([], [], "a", "2026-08-10")).toBe(false);
  });

  it("does not prompt when the last play was too long ago for a streak to be at risk", () => {
    // played once, four days ago — no streak survived into the day before yesterday
    const results = [makeResult("a", "2026-08-06")];
    expect(shouldPromptSkip(results, [], "a", "2026-08-10")).toBe(false);
  });

  it("does not prompt when no skip is currently eligible", () => {
    const skips = [makeSkip("a", "2026-08-05", "2026-08-05")];
    expect(shouldPromptSkip([], skips, "a", "2026-08-10")).toBe(false);
  });

  it("does not prompt a person who has only ever played today, with no prior streak", () => {
    // Regression: today's own play must not leak into the "was there a
    // streak before yesterday's gap" check.
    const results = [makeResult("a", "2026-08-10")];
    expect(shouldPromptSkip(results, [], "a", "2026-08-10")).toBe(false);
  });
});
