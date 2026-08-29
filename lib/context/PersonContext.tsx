"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "games:currentPersonId";

interface PersonContextValue {
  currentPersonId: string | null;
  setCurrentPersonId: (id: string | null) => void;
  hydrated: boolean;
}

const PersonContext = createContext<PersonContextValue | null>(null);

export function PersonProvider({ children }: { children: ReactNode }) {
  const [currentPersonId, setCurrentPersonIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCurrentPersonIdState(localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall back to picking every visit.
    }
    setHydrated(true);
  }, []);

  function setCurrentPersonId(id: string | null) {
    setCurrentPersonIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <PersonContext.Provider value={{ currentPersonId, setCurrentPersonId, hydrated }}>
      {children}
    </PersonContext.Provider>
  );
}

export function usePerson(): PersonContextValue {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error("usePerson must be used within PersonProvider");
  return ctx;
}
