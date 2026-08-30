"use client";

import { useAppData } from "@/lib/context/AppDataContext";
import {
  computeDailyGameStandings,
  computeDailyOverallWinners,
  resultsForGameAndDate,
} from "@/lib/scoring";
import { GAMES, GAME_LABELS, type Game, type Result } from "@/lib/types";

const GAME_ICON: Record<Game, string> = {
  wordle: "🟩",
  connections: "🟪",
  strands: "🔵",
};

const TIEBREAK_NOTE: Record<Game, string | null> = {
  wordle: null,
  connections: "Ties on mistakes are broken by who solved the harder categories (blue/purple) earlier.",
  strands: "Ties on hints are broken by who found the spangram earlier.",
};

function scoreLabel(game: Game, score: number): string {
  if (game === "wordle") return score === 7 ? "X/6" : `${score}/6`;
  if (game === "connections") return `${score} mistake${score === 1 ? "" : "s"}`;
  return `${score} hint${score === 1 ? "" : "s"}`;
}

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
  const qualifying = [...byPerson.entries()]
    .filter(([, rs]) => GAMES.every((g) => rs.some((r) => r.game === g)))
    .map(([personId, rs]) => ({
      personId,
      byGame: GAMES.map((g) => rs.find((r) => r.game === g)!.score),
      sum: rs.reduce((s, r) => s + r.score, 0),
    }))
    .sort((a, b) => a.sum - b.sum);
  const overallWinnerIds = new Set(computeDailyOverallWinners(dateResults).map((w) => w.personId));

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
                        {q.byGame.join(" + ")} = {q.sum}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-neutral-500">
                  Lowest combined score wins, among everyone who&apos;s played all three games —
                  even without winning any single category. Winning a game and winning the day
                  are different things.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
