"use client";

import { useAppData } from "@/lib/context/AppDataContext";
import { todayDateString } from "@/lib/today";
import {
  computeDailyOverallWinners,
  dailyGameWinners,
  resultsForDate,
  resultsForGameAndDate,
} from "@/lib/scoring";
import { GAMES, GAME_LABELS, type Game } from "@/lib/types";

const GAME_ICON: Record<Game, string> = {
  wordle: "🟩",
  connections: "🟪",
  strands: "🔵",
};

export default function TodaySummary() {
  const { results, people } = useAppData();
  const today = todayDateString();
  const todayResults = resultsForDate(results, today);

  function nameFor(id: string) {
    return people.find((p) => p.id === id)?.name ?? "someone";
  }

  const overallWinners = computeDailyOverallWinners(todayResults);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div>
        <h2 className="font-medium">Today&apos;s winners</h2>
        <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
          {GAMES.map((game) => {
            const gameResults = resultsForGameAndDate(results, game, today);
            if (gameResults.length === 0) {
              return (
                <div key={game}>
                  <p className="text-xs uppercase text-neutral-500">{GAME_LABELS[game]}</p>
                  <p className="text-neutral-400">–</p>
                </div>
              );
            }
            const winnerIds = dailyGameWinners(gameResults);
            return (
              <div key={game}>
                <p className="text-xs uppercase text-neutral-500">{GAME_LABELS[game]}</p>
                {winnerIds.map((id) => (
                  <p key={id}>{nameFor(id)}</p>
                ))}
              </div>
            );
          })}
        </div>
        {overallWinners.length > 0 && (
          <p className="mt-3 text-sm font-medium">
            🏆 Overall winner: {overallWinners.map((w) => nameFor(w.personId)).join(" & ")}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xs uppercase text-neutral-500">Who&apos;s played today</h3>
        <div className="mt-2 flex flex-col gap-1">
          {people.map((person) => {
            const played = GAMES.filter((g) =>
              todayResults.some((r) => r.person_id === person.id && r.game === g)
            );
            return (
              <div key={person.id} className="flex items-center justify-between text-sm">
                <span>{person.name}</span>
                <span className="flex gap-1">
                  {GAMES.map((g) => (
                    <span key={g} className={played.includes(g) ? "" : "opacity-20"}>
                      {GAME_ICON[g]}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
          {people.length === 0 && <p className="text-sm text-neutral-400">No family members yet.</p>}
        </div>
      </div>
    </div>
  );
}
