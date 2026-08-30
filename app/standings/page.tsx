"use client";

import { useState } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { computeSeasonStandings } from "@/lib/scoring";
import { computeConnectionsStats, computeStrandsStats, computeWordleStats } from "@/lib/personStats";
import { filterByDateRange, type DateRange } from "@/lib/dateFilter";
import { GAMES, GAME_LABELS, type Game, type Result } from "@/lib/types";
import DateFilter from "@/components/DateFilter";
import PointsExplainer from "@/components/PointsExplainer";

type Tab = "overall" | Game;

const TAB_LABELS: Record<Tab, string> = {
  overall: "Overall",
  wordle: GAME_LABELS.wordle,
  connections: GAME_LABELS.connections,
  strands: GAME_LABELS.strands,
};

const GAME_ICON: Record<Game, string> = {
  wordle: "🟩",
  connections: "🟪",
  strands: "🔵",
};

function perGameSubtext(game: Game, results: Result[]): string {
  if (game === "wordle") {
    const stats = computeWordleStats(results);
    return stats.avgGuesses !== null ? `avg ${stats.avgGuesses.toFixed(2)} guesses` : "no solves yet";
  }
  if (game === "connections") {
    const stats = computeConnectionsStats(results);
    return stats.avgMistakes !== null ? `avg ${stats.avgMistakes.toFixed(2)} mistakes` : "";
  }
  const stats = computeStrandsStats(results);
  return stats.avgHints !== null ? `avg ${stats.avgHints.toFixed(2)} hints` : "";
}

export default function StandingsPage() {
  const { results, people } = useAppData();
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [tab, setTab] = useState<Tab>("overall");

  const filtered = filterByDateRange(results, range);
  const standings = computeSeasonStandings(filtered);

  function nameFor(id: string) {
    return people.find((p) => p.id === id)?.name ?? "someone";
  }

  const rows =
    tab === "overall"
      ? standings.map((s) => ({ personId: s.personId, points: s.totalPoints, standing: s }))
      : standings
          .filter((s) => filtered.some((r) => r.person_id === s.personId && r.game === tab))
          .map((s) => ({ personId: s.personId, points: s.byGame[tab], standing: s }))
          .sort((a, b) => b.points - a.points);

  return (
    <div className="flex flex-col gap-4">
      <DateFilter onChange={setRange} />
      <PointsExplainer />

      <div className="flex flex-wrap gap-2 text-sm">
        {(["overall", ...GAMES] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1 ${
              tab === t
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">
            No results in this range yet.
          </p>
        )}
        {rows.map((row, i) => (
          <div
            key={row.personId}
            className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-sm text-neutral-400">{i + 1}</span>
              <span className="font-medium">{nameFor(row.personId)}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{row.points.toFixed(1)} pts</p>
              {tab === "overall" ? (
                <p className="text-xs text-neutral-500">
                  {GAMES.map((g) => `${GAME_ICON[g]} ${row.standing.byGame[g].toFixed(1)}`).join(
                    "  "
                  )}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  {perGameSubtext(
                    tab,
                    filtered.filter((r) => r.person_id === row.personId && r.game === tab)
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
