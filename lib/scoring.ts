import type { ConnectionsColor, Game, Result } from "./types";
import { GAMES } from "./types";

export const POINTS_BY_PLACE = [3, 2, 1];
export const OVERALL_WINNER_BONUS = 2;

// Standard NYT Connections convention: yellow is the most straightforward
// category, purple the trickiest. Used only to break ties in mistakes.
const CONNECTIONS_DIFFICULTY: Record<ConnectionsColor, number> = {
  yellow: 1,
  green: 2,
  blue: 3,
  purple: 4,
};

const CONNECTIONS_CATEGORY_COUNT = 4;

/**
 * Rewards solving harder categories earlier. For each solved color, weight
 * its difficulty by how early it was solved (1st solve counts most). Lower
 * return value = better play, to match the ascending "lower is better"
 * convention every other rank key uses — so this is the *negative* of the
 * raw quality score. Weighted against a fixed 4-category scale (not the
 * array's own length) so a partial solve_order — possible via manual entry,
 * where the picker allows leaving some slots blank — can't score on a
 * different scale than a full one; an empty order scores 0, which sorts
 * worse than any real solve (whose raw quality is always > 0).
 */
function connectionsQualityRank(result: Result): number {
  const order = result.solve_order;
  if (!order || order.length === 0) return 0;
  let quality = 0;
  order.forEach((color, idx) => {
    const positionWeight = CONNECTIONS_CATEGORY_COUNT - idx; // 1st solve weighted highest
    quality += (CONNECTIONS_DIFFICULTY[color] ?? 0) * positionWeight;
  });
  return -quality;
}

/**
 * Rewards finding the spangram earlier. Already ascending (lower position
 * = found earlier = better). Missing data sorts last among ties.
 */
function strandsSpangramRank(result: Result): number {
  return result.spangram_position ?? 999;
}

/**
 * Rewards finding a correct letter earlier. Already ascending (lower guess
 * number = found sooner = better). Missing data (no grid was pasted, or a
 * fail with no green tile at all) sorts last among ties.
 */
function wordleFirstGreenRank(result: Result): number {
  return result.first_green_guess ?? 999;
}

/** Lexicographic comparison: first differing element decides. */
function compareRankKeys(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Splits the points pool for a run of tied places across the tied people.
 * "Tied" means every element of their rank key matches — e.g. two people
 * tied for 1st/2nd share (3+2)=5 pts, 2.5 each.
 */
function pooledPlacePoints<T>(entries: T[], rankKeyOf: (item: T) => number[]): Map<T, number> {
  const sorted = [...entries].sort((a, b) => compareRankKeys(rankKeyOf(a), rankKeyOf(b)));
  const points = new Map<T, number>();
  let place = 1;
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && compareRankKeys(rankKeyOf(sorted[j]), rankKeyOf(sorted[i])) === 0) {
      j++;
    }
    const groupSize = j - i;
    let pool = 0;
    for (let p = place; p < place + groupSize; p++) {
      pool += POINTS_BY_PLACE[p - 1] ?? 0;
    }
    const share = pool / groupSize;
    for (let k = i; k < j; k++) points.set(sorted[k], share);
    place += groupSize;
    i = j;
  }
  return points;
}

/**
 * The rank key for a result within its game: primarily raw score (fewer
 * guesses/mistakes/hints wins), with a game-specific tiebreaker for equal
 * scores.
 */
function rankKeyForResult(result: Result): number[] {
  if (result.game === "connections") return [result.score, connectionsQualityRank(result)];
  if (result.game === "strands") return [result.score, strandsSpangramRank(result)];
  return [result.score, wordleFirstGreenRank(result)];
}

export interface DailyGameStanding {
  personId: string;
  score: number;
  points: number;
}

/** `results` must all be for a single game on a single date. */
export function computeDailyGameStandings(results: Result[]): DailyGameStanding[] {
  const pointsByResult = pooledPlacePoints(results, rankKeyForResult);
  return results.map((r) => ({
    personId: r.person_id,
    score: r.score,
    points: pointsByResult.get(r) ?? 0,
  }));
}

/** Winner(s) of a single game on a single date — highest points earned, after tiebreak. */
export function dailyGameWinners(results: Result[]): string[] {
  const standings = computeDailyGameStandings(results);
  if (standings.length === 0) return [];
  const maxPoints = Math.max(...standings.map((s) => s.points));
  return standings.filter((s) => s.points === maxPoints).map((s) => s.personId);
}

export interface OverallWinner {
  personId: string;
  totalPoints: number;
  bonusPoints: number;
}

/**
 * `results` must all be for a single date (any/all games). Ranked by
 * combined points earned across the three games — not raw score — since
 * points already normalize each game onto the same 0-3 scale and already
 * incorporate that game's own tiebreaker (Wordle first-green timing,
 * Connections solve order, Strands spangram timing). Summing raw scores
 * instead would let Connections' unbounded mistake count swamp the other
 * two games, and picking a single game's tiebreaker to decide the whole
 * day would ignore a real advantage in whichever game gets checked second.
 * A tied points total splits the
 * bonus evenly — that tie already means they were equally strong today,
 * just via different games, so reaching for another signal to force a
 * winner would reintroduce the same "one game arbitrarily decides" problem.
 */
export function computeDailyOverallWinners(results: Result[]): OverallWinner[] {
  const byPerson = new Map<string, Result[]>();
  for (const r of results) {
    const list = byPerson.get(r.person_id) ?? [];
    list.push(r);
    byPerson.set(r.person_id, list);
  }

  const qualifyingIds = new Set(
    [...byPerson.entries()]
      .filter(([, personResults]) => GAMES.every((g) => personResults.some((r) => r.game === g)))
      .map(([personId]) => personId)
  );

  if (qualifyingIds.size === 0) return [];

  const pointsByPerson = new Map<string, number>();
  for (const game of GAMES) {
    const gameResults = results.filter((r) => r.game === game);
    for (const standing of computeDailyGameStandings(gameResults)) {
      if (!qualifyingIds.has(standing.personId)) continue;
      pointsByPerson.set(
        standing.personId,
        (pointsByPerson.get(standing.personId) ?? 0) + standing.points
      );
    }
  }

  const maxPoints = Math.max(...[...qualifyingIds].map((id) => pointsByPerson.get(id) ?? 0));
  const winnerIds = [...qualifyingIds].filter((id) => (pointsByPerson.get(id) ?? 0) === maxPoints);
  const bonusShare = OVERALL_WINNER_BONUS / winnerIds.length;

  return winnerIds.map((personId) => ({
    personId,
    totalPoints: pointsByPerson.get(personId) ?? 0,
    bonusPoints: bonusShare,
  }));
}

export interface SeasonStanding {
  personId: string;
  gamePoints: number;
  bonusPoints: number;
  totalPoints: number;
  byGame: Record<Game, number>;
}

/**
 * `results` should already be filtered to whatever date range is active —
 * this function has no notion of "all time" vs a window.
 */
export function computeSeasonStandings(results: Result[]): SeasonStanding[] {
  const totals = new Map<
    string,
    { gamePoints: number; bonusPoints: number; byGame: Record<Game, number> }
  >();
  const emptyByGame = (): Record<Game, number> => ({ wordle: 0, connections: 0, strands: 0 });
  const add = (personId: string, points: number, bonusPoints: number, game: Game | null) => {
    const entry = totals.get(personId) ?? { gamePoints: 0, bonusPoints: 0, byGame: emptyByGame() };
    entry.gamePoints += points;
    entry.bonusPoints += bonusPoints;
    if (game) entry.byGame[game] += points;
    totals.set(personId, entry);
  };

  const byDate = groupBy(results, (r) => r.date);
  for (const dateResults of byDate.values()) {
    const byGame = groupBy(dateResults, (r) => r.game);
    for (const game of GAMES) {
      const gameResults = byGame.get(game) ?? [];
      for (const standing of computeDailyGameStandings(gameResults)) {
        add(standing.personId, standing.points, 0, game);
      }
    }
    for (const winner of computeDailyOverallWinners(dateResults)) {
      add(winner.personId, 0, winner.bonusPoints, null);
    }
  }

  return [...totals.entries()]
    .map(([personId, { gamePoints, bonusPoints, byGame }]) => ({
      personId,
      gamePoints,
      bonusPoints,
      totalPoints: gamePoints + bonusPoints,
      byGame,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

function groupBy<T, K>(items: T[], keyOf: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function resultsForDate(results: Result[], date: string): Result[] {
  return results.filter((r) => r.date === date);
}

export function resultsForGameAndDate(results: Result[], game: Game, date: string): Result[] {
  return results.filter((r) => r.game === game && r.date === date);
}
