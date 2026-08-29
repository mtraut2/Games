"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { addPerson, deletePerson } from "@/lib/db";
import { computePersonStreak } from "@/lib/streaks";
import { todayDateString } from "@/lib/today";

export default function PeoplePage() {
  const { people, results, skips, refetch } = useAppData();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const today = todayDateString();

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addPerson(name);
      setName("");
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    setRemoving(true);
    try {
      await deletePerson(id);
      await refetch();
    } finally {
      setRemoving(false);
      setConfirmingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a family member"
          className="flex-1 rounded-lg border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {people.map((p) => {
          const { current, longest } = computePersonStreak(results, skips, p.id, today);
          const confirming = confirmingId === p.id;
          return (
            <div
              key={p.id}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <Link href={`/people/${p.id}`} className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-neutral-500">
                    🔥 {current} current · {longest} longest
                  </p>
                </Link>
                {!confirming && (
                  <button
                    onClick={() => setConfirmingId(p.id)}
                    className="text-xs text-neutral-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              {confirming && (
                <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs dark:bg-red-950">
                  <span className="text-red-700 dark:text-red-300">
                    Remove {p.name}? This also deletes their results, reactions, and comments.
                  </span>
                  <div className="flex shrink-0 gap-3 pl-3">
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={removing}
                      className="font-medium text-red-600 hover:text-red-700"
                    >
                      {removing ? "…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      disabled={removing}
                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {people.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">
            No family members yet — add one above.
          </p>
        )}
      </div>
    </div>
  );
}
