"use client";

import type { ReactNode } from "react";
import { useAppData } from "@/lib/context/AppDataContext";
import { usePerson } from "@/lib/context/PersonContext";
import PersonPicker from "./PersonPicker";
import TabNav from "./TabNav";

export default function Shell({ children }: { children: ReactNode }) {
  const { people, loading, error } = useAppData();
  const { currentPersonId, hydrated } = usePerson();

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-medium text-red-600">Couldn&apos;t connect to Supabase</p>
        <p className="text-sm text-neutral-500">{error}</p>
        <p className="text-xs text-neutral-400">
          Check .env.local has your Supabase URL and anon key, and that the migration has run.
        </p>
      </div>
    );
  }

  const currentPerson = people.find((p) => p.id === currentPersonId);
  if (!currentPerson) {
    return <PersonPicker />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-semibold">Games</h1>
          <span className="text-sm text-neutral-500">👋 {currentPerson.name}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">{children}</main>
      <TabNav />
    </div>
  );
}
