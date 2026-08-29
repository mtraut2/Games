import { describe, expect, it } from "vitest";
import { filterByDateRange, rangeForPreset } from "./dateFilter";

describe("rangeForPreset", () => {
  it("'all' has no bounds", () => {
    expect(rangeForPreset("all", "2024-01-15")).toEqual({ start: null, end: null });
  });

  it("'week' starts on Monday when today is a Monday", () => {
    // 2024-01-01 was a Monday.
    expect(rangeForPreset("week", "2024-01-01")).toEqual({
      start: "2024-01-01",
      end: "2024-01-01",
    });
  });

  it("'week' starts on the prior Monday mid-week", () => {
    // 2024-01-03 was a Wednesday.
    expect(rangeForPreset("week", "2024-01-03")).toEqual({
      start: "2024-01-01",
      end: "2024-01-03",
    });
  });

  it("'week' treats Sunday as the last day of the prior Monday's week", () => {
    // 2024-01-07 was a Sunday, still part of the week that started 2024-01-01.
    expect(rangeForPreset("week", "2024-01-07")).toEqual({
      start: "2024-01-01",
      end: "2024-01-07",
    });
  });

  it("'30days' covers today and the 29 days before it", () => {
    expect(rangeForPreset("30days", "2024-01-31")).toEqual({
      start: "2024-01-02",
      end: "2024-01-31",
    });
  });

  it("'month' starts on the 1st of today's month", () => {
    expect(rangeForPreset("month", "2024-01-15")).toEqual({
      start: "2024-01-01",
      end: "2024-01-15",
    });
    expect(rangeForPreset("month", "2024-12-05")).toEqual({
      start: "2024-12-01",
      end: "2024-12-05",
    });
  });

  it("'custom' passes through the given range", () => {
    const custom = { start: "2024-02-01", end: "2024-02-10" };
    expect(rangeForPreset("custom", "2024-01-15", custom)).toEqual(custom);
  });

  it("'custom' with no range supplied has no bounds", () => {
    expect(rangeForPreset("custom", "2024-01-15")).toEqual({ start: null, end: null });
  });
});

describe("filterByDateRange", () => {
  const items = [{ date: "2024-01-05" }, { date: "2024-01-10" }, { date: "2024-01-15" }];

  it("includes items on the boundary dates (inclusive both ends)", () => {
    const filtered = filterByDateRange(items, { start: "2024-01-05", end: "2024-01-15" });
    expect(filtered).toHaveLength(3);
  });

  it("excludes items outside the range", () => {
    const filtered = filterByDateRange(items, { start: "2024-01-06", end: "2024-01-12" });
    expect(filtered).toEqual([{ date: "2024-01-10" }]);
  });

  it("treats a null bound as unrestricted", () => {
    expect(filterByDateRange(items, { start: null, end: "2024-01-10" })).toHaveLength(2);
    expect(filterByDateRange(items, { start: "2024-01-10", end: null })).toHaveLength(2);
    expect(filterByDateRange(items, { start: null, end: null })).toHaveLength(3);
  });
});
