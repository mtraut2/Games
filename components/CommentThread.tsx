"use client";

import { useState, type FormEvent } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { usePerson } from "@/lib/context/PersonContext";
import { addComment } from "@/lib/db";

export default function CommentThread({ resultId }: { resultId: string }) {
  const { comments, people, refetch } = useAppData();
  const { currentPersonId } = usePerson();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const threadComments = comments.filter((c) => c.result_id === resultId);

  function nameFor(personId: string) {
    return people.find((p) => p.id === personId)?.name ?? "someone";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentPersonId || !text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(resultId, currentPersonId, text);
      setText("");
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {threadComments.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="font-medium">{nameFor(c.person_id)}</span>{" "}
          <span className="text-neutral-600 dark:text-neutral-400">{c.text}</span>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="mt-1 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="rounded-lg bg-neutral-800 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900"
        >
          Post
        </button>
      </form>
    </div>
  );
}
