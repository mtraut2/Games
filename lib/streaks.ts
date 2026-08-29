import type { Result, Skip } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const SKIP_COOLDOWN_DAYS = 30;
const SKIP_RETROACTIVE_DAYS = 1;

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number): string {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Number of days from `a` to `b` (positive when `b` is later). */
export function dateDiffDays(a: string, b: string): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / DAY_MS);
}

export interface StreakInfo {
  current: number;
  longest: number;
}

/**
 * `activeDates` are the days (YYYY-MM-DD) on which the person is considered
 * to have kept their streak alive (played a game, or used a skip). Always
 * computed over the full history passed in — callers should NOT pre-filter
 * by the global date-range filter, per spec (streaks are always all-time).
 */
export function computeStreak(activeDates: string[], today: string): StreakInfo {
  const unique = [...new Set(activeDates)].sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    if (dateDiffDays(unique[i - 1], unique[i]) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const mostRecent = unique[unique.length - 1];
  const gapFromToday = dateDiffDays(mostRecent, today);
  // Streak is dead if the most recent active day is more than 1 day ago
  // (today not yet played is fine — grace period through end of "yesterday").
  if (gapFromToday > 1) return { current: 0, longest };

  let current = 1;
  for (let i = unique.length - 1; i > 0; i--) {
    if (dateDiffDays(unique[i - 1], unique[i]) === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

function activeDatesForPerson(results: Result[], skips: Skip[], personId: string): string[] {
  const resultDates = results.filter((r) => r.person_id === personId).map((r) => r.date);
  const skipDates = skips.filter((s) => s.person_id === personId).map((s) => s.date_covered);
  return [...resultDates, ...skipDates];
}

export function computePersonStreak(
  results: Result[],
  skips: Skip[],
  personId: string,
  today: string
): StreakInfo {
  return computeStreak(activeDatesForPerson(results, skips, personId), today);
}

/**
 * Whether a skip can be claimed today to cover `dateCovered`. Two
 * independent conditions must hold:
 *  - `dateCovered` is today or yesterday (skips can be applied up to
 *    1 day retroactively, not further back).
 *  - the person's most recent skip (by date_covered) is at least
 *    30 days before `dateCovered` (a continuously-rolling window, not a
 *    calendar month) — or they've never used one.
 */
export function isSkipEligibleForDate(
  skips: Skip[],
  personId: string,
  dateCovered: string,
  today: string
): boolean {
  const daysOld = dateDiffDays(dateCovered, today);
  if (daysOld < 0 || daysOld > SKIP_RETROACTIVE_DAYS) return false;

  const personSkips = skips
    .filter((s) => s.person_id === personId)
    .sort((a, b) => (a.date_covered < b.date_covered ? 1 : -1)); // most recent first

  if (personSkips.length === 0) return true;

  const lastSkipDate = personSkips[0].date_covered;
  return dateDiffDays(lastSkipDate, dateCovered) >= SKIP_COOLDOWN_DAYS;
}

/** The date a skip would become available again for this person, or null if eligible now. */
export function nextSkipEligibleDate(skips: Skip[], personId: string): string | null {
  const personSkips = skips
    .filter((s) => s.person_id === personId)
    .sort((a, b) => (a.date_covered < b.date_covered ? 1 : -1));
  if (personSkips.length === 0) return null;
  return addDays(personSkips[0].date_covered, SKIP_COOLDOWN_DAYS);
}

/**
 * Should the Today screen proactively prompt "Skip yesterday to save your
 * streak?" — true when yesterday was missed (no result, no skip already
 * applied), a skip is currently eligible for it, AND there's an actual
 * streak at risk (i.e. they were still on one through the day before
 * yesterday) — otherwise a brand-new person with no history would be
 * nonsensically prompted to "save" a streak they never had.
 */
export function shouldPromptSkip(
  results: Result[],
  skips: Skip[],
  personId: string,
  today: string
): boolean {
  const yesterday = addDays(today, -1);
  const activeDates = activeDatesForPerson(results, skips, personId);
  const active = new Set(activeDates);
  if (active.has(yesterday)) return false;
  if (!isSkipEligibleForDate(skips, personId, yesterday, today)) return false;

  // Only dates through the gap count — today's own play (if any) shouldn't
  // leak into "was there already a streak before yesterday's gap", since
  // computeStreak assumes its reference date is the latest date in play.
  const dayBeforeYesterday = addDays(today, -2);
  const datesBeforeGap = activeDates.filter((d) => d <= dayBeforeYesterday);
  return computeStreak(datesBeforeGap, dayBeforeYesterday).current > 0;
}
