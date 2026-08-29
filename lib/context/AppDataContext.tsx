"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchComments,
  fetchPeople,
  fetchReactions,
  fetchResults,
  fetchSkips,
} from "@/lib/db";
import type { Comment, Person, Reaction, Result, Skip } from "@/lib/types";

interface AppData {
  people: Person[];
  results: Result[];
  skips: Skip[];
  reactions: Reaction[];
  comments: Comment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [skips, setSkips] = useState<Skip[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const [p, r, s, rx, c] = await Promise.all([
        fetchPeople(),
        fetchResults(),
        fetchSkips(),
        fetchReactions(),
        fetchComments(),
      ]);
      setPeople(p);
      setResults(r);
      setSkips(s);
      setReactions(rx);
      setComments(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load data from Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Today's feed (and everything else) updates live: any change to these
  // tables from any device triggers a refetch for everyone connected.
  useEffect(() => {
    const channel = supabase
      .channel("public:games")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "people" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "skips" }, refetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <AppDataContext.Provider
      value={{ people, results, skips, reactions, comments, loading, error, refetch }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
