"use client";

import { useState } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { computePersonStreak } from "@/lib/streaks";
import { todayDateString } from "@/lib/today";
import { GAMES, GAME_LABELS, type Game, type Result } from "@/lib/types";
import {
  computeConnectionsStats,
  computeStrandsStats,
  computeWordleStats,
} from "@/lib/personStats";
import GuessDistribution from "@/components/charts/GuessDistribution";
import SolveOrderChart from "@/components/charts/SolveOrderChart";
import SpangramPositionChart from "@/components/charts/SpangramPositionChart";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function WordlePanel({ results }: { results: Result[] }) {
  const stats = computeWordleStats(results);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <StatRow label="Played" value={String(stats.played)} />
      <StatRow label="Avg guesses" value={stats.avgGuesses ? stats.avgGuesses.toFixed(2) : "–"} />
      <StatRow label="Win %" value={`${stats.winPct.toFixed(0)}%`} />
      <StatRow
        label="Best puzzle"
        value={
          stats.bestPuzzle
            ? `#${stats.bestPuzzle.puzzle_number ?? "?"} (${stats.bestPuzzle.failed ? "X" : stats.bestPuzzle.score}/6)`
            : "–"
        }
      />
      <StatRow
        label="Worst puzzle"
        value={
          stats.worstPuzzle
            ? `#${stats.worstPuzzle.puzzle_number ?? "?"} (${stats.worstPuzzle.failed ? "X" : stats.worstPuzzle.score}/6)`
            : "–"
        }
      />
      <GuessDistribution stats={stats} />
    </div>
  );
}

function ConnectionsPanel({ results }: { results: Result[] }) {
  const stats = computeConnectionsStats(results);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <StatRow label="Played" value={String(stats.played)} />
      <StatRow
        label="Avg mistakes"
        value={stats.avgMistakes !== null ? stats.avgMistakes.toFixed(2) : "–"}
      />
      <StatRow label="Perfect games" value={`${stats.perfectPct.toFixed(0)}%`} />
      <SolveOrderChart stats={stats} />
    </div>
  );
}

function StrandsPanel({ results }: { results: Result[] }) {
  const stats = computeStrandsStats(results);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <StatRow label="Played" value={String(stats.played)} />
      <StatRow label="Avg hints" value={stats.avgHints !== null ? stats.avgHints.toFixed(2) : "–"} />
      <StatRow label="Hint-free games" value={`${stats.hintFreePct.toFixed(0)}%`} />
      <StatRow label="Spangram found first" value={`${stats.spangramFirstPct.toFixed(0)}%`} />
      <StatRow
        label="Avg spangram position"
        value={stats.avgSpangramPosition !== null ? stats.avgSpangramPosition.toFixed(1) : "–"}
      />
      <SpangramPositionChart stats={stats} />
    </div>
  );
}

export default function PersonDetailPage({ params }: { params: { id: string } }) {
  const { people, results, skips } = useAppData();
  const [tab, setTab] = useState<Game>("wordle");

  const person = people.find((p) => p.id === params.id);
  const personResults = results.filter((r) => r.person_id === params.id);
  const today = todayDateString();

  if (!person) {
    return <p className="py-10 text-center text-sm text-neutral-400">Person not found.</p>;
  }

  const streak = computePersonStreak(results, skips, person.id, today);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{person.name}</h1>
        <p className="text-sm text-neutral-500">
          🔥 {streak.current} current streak · {streak.longest} longest
        </p>
      </div>

      <div className="flex gap-2">
        {GAMES.map((g) => (
          <button
            key={g}
            onClick={() => setTab(g)}
            className={`rounded-full border px-3 py-1 text-sm ${
              tab === g
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
            }`}
          >
            {GAME_LABELS[g]}
          </button>
        ))}
      </div>

      {tab === "wordle" && (
        <WordlePanel results={personResults.filter((r) => r.game === "wordle")} />
      )}
      {tab === "connections" && (
        <ConnectionsPanel results={personResults.filter((r) => r.game === "connections")} />
      )}
      {tab === "strands" && (
        <StrandsPanel results={personResults.filter((r) => r.game === "strands")} />
      )}
    </div>
  );
}
