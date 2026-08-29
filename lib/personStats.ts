import type { ConnectionsColor, Result } from "./types";

export interface WordleStats {
  played: number;
  avgGuesses: number | null;
  winPct: number;
  distribution: Record<number, number>; // 1-6 -> count of solves
  failCount: number;
  bestPuzzle: Result | null;
  worstPuzzle: Result | null;
}

export function computeWordleStats(results: Result[]): WordleStats {
  const played = results.length;
  const solved = results.filter((r) => !r.failed);
  const failCount = played - solved.length;
  const avgGuesses =
    solved.length > 0 ? solved.reduce((sum, r) => sum + r.score, 0) / solved.length : null;
  const winPct = played > 0 ? (solved.length / played) * 100 : 0;

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const r of solved) distribution[r.score] = (distribution[r.score] ?? 0) + 1;

  const sorted = [...results].sort((a, b) => a.score - b.score);
  return {
    played,
    avgGuesses,
    winPct,
    distribution,
    failCount,
    bestPuzzle: sorted[0] ?? null,
    worstPuzzle: sorted[sorted.length - 1] ?? null,
  };
}

export interface ConnectionsStats {
  played: number;
  avgMistakes: number | null;
  perfectPct: number;
  /** color -> counts at [1st, 2nd, 3rd, 4th] solve position */
  solveOrderByColor: Record<ConnectionsColor, number[]>;
}

const CONNECTIONS_COLORS: ConnectionsColor[] = ["yellow", "green", "blue", "purple"];

export function computeConnectionsStats(results: Result[]): ConnectionsStats {
  const played = results.length;
  const avgMistakes =
    played > 0 ? results.reduce((sum, r) => sum + r.score, 0) / played : null;
  const perfectCount = results.filter((r) => r.score === 0).length;
  const perfectPct = played > 0 ? (perfectCount / played) * 100 : 0;

  const solveOrderByColor: Record<ConnectionsColor, number[]> = {
    yellow: [0, 0, 0, 0],
    green: [0, 0, 0, 0],
    blue: [0, 0, 0, 0],
    purple: [0, 0, 0, 0],
  };
  for (const r of results) {
    if (!r.solve_order) continue;
    r.solve_order.forEach((color, idx) => {
      if (idx < 4 && CONNECTIONS_COLORS.includes(color)) solveOrderByColor[color][idx] += 1;
    });
  }

  return { played, avgMistakes, perfectPct, solveOrderByColor };
}

export interface StrandsStats {
  played: number;
  avgHints: number | null;
  hintFreePct: number;
  spangramFirstPct: number;
  avgSpangramPosition: number | null;
  spangramPositionCounts: Record<number, number>;
}

export function computeStrandsStats(results: Result[]): StrandsStats {
  const played = results.length;
  const avgHints = played > 0 ? results.reduce((sum, r) => sum + r.score, 0) / played : null;
  const hintFreeCount = results.filter((r) => r.score === 0).length;
  const hintFreePct = played > 0 ? (hintFreeCount / played) * 100 : 0;

  const withSpangram = results.filter(
    (r): r is Result & { spangram_position: number } => r.spangram_position !== null
  );
  const spangramFirstCount = withSpangram.filter((r) => r.spangram_position === 1).length;
  const spangramFirstPct =
    withSpangram.length > 0 ? (spangramFirstCount / withSpangram.length) * 100 : 0;
  const avgSpangramPosition =
    withSpangram.length > 0
      ? withSpangram.reduce((sum, r) => sum + r.spangram_position, 0) / withSpangram.length
      : null;

  const spangramPositionCounts: Record<number, number> = {};
  for (const r of withSpangram) {
    spangramPositionCounts[r.spangram_position] =
      (spangramPositionCounts[r.spangram_position] ?? 0) + 1;
  }

  return { played, avgHints, hintFreePct, spangramFirstPct, avgSpangramPosition, spangramPositionCounts };
}
