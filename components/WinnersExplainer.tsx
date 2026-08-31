"use client";

import { useAppData } from "@/lib/context/AppDataContext";
import {
  computeDailyGameStandings,
  computeDailyOverallWinners,
  resultsForGameAndDate,
} from "@/lib/scoring";
import { scoreLabel } from "@/lib/scoreLabel";
import { GAMES, GAME_LABELS, type Game, type Result } from "@/lib/types";

const GAME_ICON: Record<Game, string> = {
  wordle: "🟩",
  connections: "🟪",
  strands: "🔵",
};

const TIEBREAK_NOTE: Record<Game, string | null> = {
  wordle: "Ties on guesses are broken by who found their first correct letter earliest.",
  connections: "Ties on mistakes are broken by who solved the harder categories (blue/purple) earlier.",
  strands: "Ties on hints are broken by who found the spangram earlier.",
};

export default function WinnersExplainer({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const { results, people } = useAppData();

  function nameFor(id: string) {
    return people.find((p) => p.id === id)?.name ?? "someone";
  }

  const dateResults = results.filter((r) => r.date === date);

  // Group today's results per person, for the overall-winner breakdown.
  const byPerson = new Map<string, Result[]>();
  for (const r of dateResults) {
    const list = byPerson.get(r.person_id) ?? [];
    list.push(r);
    byPerson.set(r.person_id, list);
  }
  const overallWinnerIds = new Set(computeDailyOverallWinners(dateResults));
  const qualifyingIds = [...byPerson.entries()]
    .filter(([, rs]) => GAMES.every((g) => rs.some((r) => r.game === g)))
    .map(([personId]) => personId);

  // Points per game (already tiebreak-adjusted), keyed by person, for the overall table below.
  const pointsByGameByPerson = new Map<string, number[]>();
  GAMES.forEach((game, idx) => {
    const gameResults = resultsForGameAndDate(results, game, date);
    for (const standing of computeDailyGameStandings(gameResults)) {
      if (!qualifyingIds.includes(standing.personId)) continue;
      const arr = pointsByGameByPerson.get(standing.personId) ?? [0, 0, 0];
      arr[idx] = standing.points;
      pointsByGameByPerson.set(standing.personId, arr);
    }
  });

  const qualifying = qualifyingIds
    .map((personId) => {
      const byGame = pointsByGameByPerson.get(personId) ?? [0, 0, 0];
      return { personId, byGame, sum: byGame.reduce((s, p) => s + p, 0) };
    })
    .sort((a, b) => b.sum - a.sum);
  const sumsTied = qualifying.filter((q) => q.sum === qualifying[0]?.sum).length > 1;

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-medium">How today&apos;s winners were picked</h2>
          <button onClick={onClose} className="text-sm text-neutral-500 underline">
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {GAMES.map((game) => {
            const gameResults = resultsForGameAndDate(results, game, date);
            const standings = computeDailyGameStandings(gameResults).sort(
              (a, b) => b.points - a.points || a.score - b.score
            );
            const maxPoints = standings.length > 0 ? Math.max(...standings.map((s) => s.points)) : 0;
            const scoresTied =
              standings.filter((s) => s.score === standings[0]?.score).length > 1;

            return (
              <section key={game}>
                <p className="text-xs font-medium uppercase text-neutral-500">
                  {GAME_ICON[game]} {GAME_LABELS[game]}
                </p>
                {standings.length === 0 ? (
                  <p className="mt-1 text-sm text-neutral-400">Nobody&apos;s played yet.</p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                    {standings.map((s) => (
                      <li key={s.personId} className="flex items-center justify-between">
                        <span className={s.points === maxPoints ? "font-medium" : "text-neutral-600 dark:text-neutral-400"}>
                          {s.points === maxPoints && "🏆 "}
                          {nameFor(s.personId)} — {scoreLabel(game, s.score)}
                        </span>
                        <span className="text-neutral-500">{s.points} pt{s.points === 1 ? "" : "s"}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {scoresTied && TIEBREAK_NOTE[game] && (
                  <p className="mt-1 text-xs text-amber-600">{TIEBREAK_NOTE[game]}</p>
                )}
              </section>
            );
          })}

          <section>
            <p className="text-xs font-medium uppercase text-neutral-500">🏆 Overall winner</p>
            {qualifying.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-400">
                Nobody&apos;s finished all three games today yet.
              </p>
            ) : (
              <>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                  {qualifying.map((q) => (
                    <li key={q.personId} className="flex items-center justify-between">
                      <span
                        className={
                          overallWinnerIds.has(q.personId)
                            ? "font-medium"
                            : "text-neutral-600 dark:text-neutral-400"
                        }
                      >
                        {overallWinnerIds.has(q.personId) && "🏆 "}
                        {nameFor(q.personId)}
                      </span>
                      <span className="text-neutral-500">
                        {q.byGame.join(" + ")} = {q.sum} pts
                      </span>
                    </li>
                  ))}
                </ul>
                {sumsTied && (
                  <p className="mt-1 text-xs text-amber-600">
                    Tied for the top combined score — everyone listed here shares today&apos;s
                    overall win.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
