import { addDays } from "./streaks";

export type DateFilterPreset = "all" | "month" | "30days" | "week" | "custom";

export interface DateRange {
  start: string | null; // inclusive; null = no lower bound
  end: string | null; // inclusive; null = no upper bound
}

export function rangeForPreset(
  preset: DateFilterPreset,
  today: string,
  custom?: DateRange
): DateRange {
  switch (preset) {
    case "all":
      return { start: null, end: null };
    case "week": {
      const d = new Date(`${today}T00:00:00Z`);
      const day = d.getUTCDay(); // 0 = Sunday
      const diffToMonday = (day + 6) % 7;
      d.setUTCDate(d.getUTCDate() - diffToMonday);
      return { start: d.toISOString().slice(0, 10), end: today };
    }
    case "30days":
      return { start: addDays(today, -29), end: today };
    case "month": {
      const d = new Date(`${today}T00:00:00Z`);
      const start = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
      return { start, end: today };
    }
    case "custom":
      return custom ?? { start: null, end: null };
  }
}

export function filterByDateRange<T extends { date: string }>(items: T[], range: DateRange): T[] {
  return items.filter((item) => {
    if (range.start && item.date < range.start) return false;
    if (range.end && item.date > range.end) return false;
    return true;
  });
}
