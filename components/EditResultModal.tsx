"use client";

import { useState } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { deleteResult, upsertResult } from "@/lib/db";
import type { Result } from "@/lib/types";
import ResultForm, { type ResultDraft } from "./submit/ResultForm";

function draftFromResult(result: Result): ResultDraft {
  return {
    game: result.game,
    personId: result.person_id,
    date: result.date,
    puzzleNumber: result.puzzle_number,
    score: result.score,
    failed: result.failed,
    solveOrder: result.solve_order ?? [],
    spangramPosition: result.spangram_position,
    firstGreenGuess: result.first_green_guess,
    rawText: result.raw_text,
  };
}

export default function EditResultModal({
  result,
  onClose,
}: {
  result: Result;
  onClose: () => void;
}) {
  const { refetch } = useAppData();
  const [draft, setDraft] = useState<ResultDraft>(draftFromResult(result));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // If the person/game/date changed, the unique key changed too — the
      // old row won't be overwritten by upsert, so remove it explicitly.
      const keyChanged =
        draft.personId !== result.person_id ||
        draft.game !== result.game ||
        draft.date !== result.date;
      if (keyChanged) {
        await deleteResult(result.id);
      }
      await upsertResult({
        person_id: draft.personId,
        game: draft.game,
        date: draft.date,
        puzzle_number: draft.puzzleNumber,
        score: draft.score,
        failed: draft.game === "wordle" ? draft.failed : false,
        raw_text: draft.rawText,
        solve_order: draft.game === "connections" ? draft.solveOrder : null,
        spangram_position: draft.game === "strands" ? draft.spangramPosition : null,
        first_green_guess: draft.game === "wordle" ? draft.firstGreenGuess : null,
      });
      await refetch();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-4 sm:rounded-2xl dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-medium">Edit result</h2>
        <div className="mt-3">
          <ResultForm draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-neutral-500 underline">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
