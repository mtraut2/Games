"use client";

import { useState } from "react";
import { detectAndParse } from "@/lib/parsers";
import { upsertResult } from "@/lib/db";
import { usePerson } from "@/lib/context/PersonContext";
import { useAppData } from "@/lib/context/AppDataContext";
import { todayDateString } from "@/lib/today";
import ResultForm, { type ResultDraft } from "./ResultForm";

function blankDraft(personId: string): ResultDraft {
  return {
    game: "wordle",
    personId,
    date: todayDateString(),
    puzzleNumber: null,
    score: 3,
    failed: false,
    solveOrder: [],
    spangramPosition: null,
    rawText: "",
  };
}

export default function SubmitFlow() {
  const { currentPersonId } = usePerson();
  const { refetch } = useAppData();
  const [pasteText, setPasteText] = useState("");
  const [draft, setDraft] = useState<ResultDraft | null>(null);
  const [needsSpangramConfirmation, setNeedsSpangramConfirmation] = useState(false);
  const [totalFoundWords, setTotalFoundWords] = useState<number | undefined>();
  const [mode, setMode] = useState<"paste" | "confirm" | "manual">("paste");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!currentPersonId) return null;

  function handleParse() {
    const parsed = detectAndParse(pasteText);
    if (!parsed) {
      setParseError(
        "Couldn't tell which game this is, or couldn't read the result from that text. Double-check you pasted the whole share result, or enter it manually below."
      );
      return;
    }
    setParseError(null);

    const base = {
      personId: currentPersonId!,
      date: todayDateString(),
      puzzleNumber: parsed.puzzleNumber,
      rawText: pasteText,
    };

    if (parsed.game === "wordle") {
      setDraft({
        ...base,
        game: "wordle",
        score: parsed.score,
        failed: parsed.failed,
        solveOrder: [],
        spangramPosition: null,
      });
      setNeedsSpangramConfirmation(false);
    } else if (parsed.game === "connections") {
      setDraft({
        ...base,
        game: "connections",
        score: parsed.score,
        failed: false,
        solveOrder: parsed.solveOrder,
        spangramPosition: null,
      });
      setNeedsSpangramConfirmation(false);
    } else {
      setDraft({
        ...base,
        game: "strands",
        score: parsed.score,
        failed: false,
        solveOrder: [],
        spangramPosition: parsed.spangramPosition,
      });
      setNeedsSpangramConfirmation(parsed.needsSpangramConfirmation);
      setTotalFoundWords(parsed.totalFoundWords);
    }
    setMode("confirm");
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
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
      });
      await refetch();
      setPasteText("");
      setDraft(null);
      setMode("paste");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(null);
    setError(null);
    setParseError(null);
    setMode("paste");
  }

  if (mode === "paste") {
    return (
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <label className="block text-sm font-medium">Paste your share text</label>
        <textarea
          value={pasteText}
          onChange={(e) => {
            setPasteText(e.target.value);
            setParseError(null);
          }}
          rows={4}
          placeholder="Paste your Wordle, Connections, or Strands result here…"
          className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        {parseError && <p className="mt-2 text-sm text-red-600">{parseError}</p>}
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => {
              setParseError(null);
              setDraft(blankDraft(currentPersonId!));
              setMode("manual");
            }}
            className="text-sm text-neutral-500 underline"
          >
            Enter manually instead
          </button>
          <button
            onClick={handleParse}
            disabled={!pasteText.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Parse result
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="font-medium">
        {mode === "manual" ? "Enter result manually" : "Confirm your result"}
      </h2>
      {needsSpangramConfirmation && (
        <p className="mt-1 text-sm text-amber-600">
          Couldn&apos;t tell which found word was the spangram — which one was it?
        </p>
      )}
      <div className="mt-3">
        <ResultForm
          draft={draft!}
          onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
          totalFoundWords={totalFoundWords}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <button onClick={handleCancel} className="text-sm text-neutral-500 underline">
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
  );
}
