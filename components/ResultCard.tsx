"use client";

import { useState } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { deleteResult } from "@/lib/db";
import { GAME_LABELS, type Result } from "@/lib/types";
import ReactionBar from "./ReactionBar";
import CommentThread from "./CommentThread";
import EditResultModal from "./EditResultModal";

const GAME_ICON: Record<Result["game"], string> = {
  wordle: "🟩",
  connections: "🟪",
  strands: "🔵",
};

function scoreLabel(result: Result): string {
  if (result.game === "wordle") return result.failed ? "X/6" : `${result.score}/6`;
  if (result.game === "connections")
    return `${result.score} mistake${result.score === 1 ? "" : "s"}`;
  return `${result.score} hint${result.score === 1 ? "" : "s"}`;
}

export default function ResultCard({ result }: { result: Result }) {
  const { people, refetch } = useAppData();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const person = people.find((p) => p.id === result.person_id);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteResult(result.id);
      await refetch();
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {GAME_ICON[result.game]} {person?.name ?? "Someone"} — {GAME_LABELS[result.game]}
          </p>
          {result.raw_text.trim() ? (
            <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-2 font-mono text-sm leading-tight text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              {result.raw_text.trim()}
            </pre>
          ) : (
            <p className="text-sm text-neutral-500">
              {scoreLabel(result)}
              {result.puzzle_number ? ` · #${result.puzzle_number}` : ""}
            </p>
          )}
        </div>
        {confirmingDelete ? (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="text-neutral-500">Delete?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="font-medium text-red-600 hover:text-red-700"
            >
              {deleting ? "…" : "Yes"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-2 text-xs text-neutral-400">
            <button
              onClick={() => setEditing(true)}
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              Edit
            </button>
            <button onClick={() => setConfirmingDelete(true)} className="hover:text-red-600">
              Delete
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <ReactionBar resultId={result.id} />
        <CommentThread resultId={result.id} />
      </div>
      {editing && <EditResultModal result={result} onClose={() => setEditing(false)} />}
    </div>
  );
}
