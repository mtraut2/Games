"use client";

import { useState, type FormEvent } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { usePerson } from "@/lib/context/PersonContext";
import { addPerson } from "@/lib/db";

export default function PersonPicker() {
  const { people, refetch } = useAppData();
  const { setCurrentPersonId } = usePerson();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const person = await addPerson(name);
      await refetch();
      setCurrentPersonId(person.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add you — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to Games</h1>
        <p className="mt-1 text-sm text-neutral-500">Who are you?</p>
      </div>

      {people.length > 0 && (
        <div className="flex w-full max-w-xs flex-col gap-2">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentPersonId(p.id)}
              className="rounded-lg border border-neutral-300 px-4 py-3 text-left font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex w-full max-w-xs flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Not on the list? Add your name"
          className="rounded-lg border border-neutral-300 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Adding…" : "That's me — add me"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
