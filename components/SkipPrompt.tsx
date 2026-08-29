"use client";

import { useState } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { usePerson } from "@/lib/context/PersonContext";
import { addDays, shouldPromptSkip } from "@/lib/streaks";
import { addSkip } from "@/lib/db";
import { todayDateString } from "@/lib/today";

export default function SkipPrompt() {
  const { results, skips, refetch } = useAppData();
  const { currentPersonId } = usePerson();
  const [applying, setApplying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!currentPersonId || dismissed) return null;

  const today = todayDateString();
  const yesterday = addDays(today, -1);
  if (!shouldPromptSkip(results, skips, currentPersonId, today)) return null;

  async function handleApply() {
    setApplying(true);
    try {
      await addSkip(currentPersonId!, yesterday, today);
      await refetch();
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
      <span>Skip yesterday to save your streak?</span>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => setDismissed(true)} className="text-neutral-500 underline">
          No thanks
        </button>
        <button
          onClick={handleApply}
          disabled={applying}
          className="rounded-lg bg-amber-600 px-3 py-1 font-medium text-white disabled:opacity-50"
        >
          {applying ? "…" : "Use skip"}
        </button>
      </div>
    </div>
  );
}
