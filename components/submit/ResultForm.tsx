"use client";

import { useAppData } from "@/lib/context/AppDataContext";
import type { ConnectionsColor, Game } from "@/lib/types";

export interface ResultDraft {
  game: Game;
  personId: string;
  date: string;
  puzzleNumber: number | null;
  score: number;
  failed: boolean;
  solveOrder: ConnectionsColor[];
  spangramPosition: number | null;
  firstGreenGuess: number | null;
  rawText: string;
}

const COLORS: ConnectionsColor[] = ["yellow", "green", "blue", "purple"];
const COLOR_EMOJI: Record<ConnectionsColor, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

const inputClass =
  "rounded-lg border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-900";

export default function ResultForm({
  draft,
  onChange,
  totalFoundWords,
}: {
  draft: ResultDraft;
  onChange: (patch: Partial<ResultDraft>) => void;
  totalFoundWords?: number;
}) {
  const { people } = useAppData();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Who
          <select
            value={draft.personId}
            onChange={(e) => onChange({ personId: e.target.value })}
            className={inputClass}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Game
          <select
            value={draft.game}
            onChange={(e) => {
              const game = e.target.value as Game;
              // Reset game-specific fields to sensible defaults for the
              // newly selected game, rather than carrying over a stale
              // score/flag from whichever game was previously selected.
              if (game === "wordle") {
                onChange({ game, score: 3, failed: false, firstGreenGuess: null });
              } else if (game === "connections") {
                onChange({ game, score: 1, solveOrder: [] });
              } else {
                onChange({ game, score: 0, spangramPosition: null });
              }
            }}
            className={inputClass}
          >
            <option value="wordle">Wordle</option>
            <option value="connections">Connections</option>
            <option value="strands">Strands</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Puzzle # (optional)
          <input
            type="number"
            value={draft.puzzleNumber ?? ""}
            onChange={(e) =>
              onChange({ puzzleNumber: e.target.value ? parseInt(e.target.value, 10) : null })
            }
            className={inputClass}
          />
        </label>
      </div>

      {draft.game === "wordle" && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            Guesses
            <select
              value={draft.failed ? "X" : String(draft.score)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "X") onChange({ failed: true, score: 7 });
                else onChange({ failed: false, score: parseInt(v, 10) });
              }}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}/6
                </option>
              ))}
              <option value="X">X/6 (fail)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            First green guess (optional)
            <input
              type="number"
              min={1}
              max={6}
              value={draft.firstGreenGuess ?? ""}
              onChange={(e) =>
                onChange({
                  firstGreenGuess: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className={inputClass}
            />
          </label>
        </div>
      )}

      {draft.game === "connections" && (
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Mistakes
            <input
              type="number"
              min={0}
              value={draft.score}
              onChange={(e) => onChange({ score: parseInt(e.target.value || "0", 10) })}
              className={inputClass}
            />
          </label>
          <div>
            <span className="text-xs text-neutral-500">Solve order (optional)</span>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <select
                  key={i}
                  value={draft.solveOrder[i] ?? ""}
                  onChange={(e) => {
                    const next = [...draft.solveOrder];
                    if (e.target.value) next[i] = e.target.value as ConnectionsColor;
                    else next.splice(i, 1);
                    onChange({ solveOrder: next.filter(Boolean) as ConnectionsColor[] });
                  }}
                  className="rounded-lg border border-neutral-300 p-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="">–</option>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>
                      {COLOR_EMOJI[c]} {c}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        </div>
      )}

      {draft.game === "strands" && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            Hints used
            <input
              type="number"
              min={0}
              value={draft.score}
              onChange={(e) => onChange({ score: parseInt(e.target.value || "0", 10) })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            Spangram position{totalFoundWords ? ` (1-${totalFoundWords})` : ""}
            <input
              type="number"
              min={1}
              max={totalFoundWords}
              value={draft.spangramPosition ?? ""}
              onChange={(e) =>
                onChange({
                  spangramPosition: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className={inputClass}
            />
          </label>
        </div>
      )}
    </div>
  );
}
