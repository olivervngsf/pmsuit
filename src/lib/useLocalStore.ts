"use client";

import { useCallback, useEffect, useState } from "react";

// A tiny localStorage-backed collection. Renders the server-provided `seed`
// first (so SSR/SSG output matches the first client render), then overlays any
// changes the user has saved in their browser. This is what lets the static
// demo support create / edit / delete with zero backend.
export function useLocalStore<T extends { id: string }>(
  key: string,
  seed: T[],
) {
  const [items, setItems] = useState<T[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw) as T[]);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [key]);

  const mutate = useCallback(
    (fn: (prev: T[]) => T[]) => {
      setItems((prev) => {
        const next = fn(prev);
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore quota / private mode */
        }
        return next;
      });
    },
    [key],
  );

  const add = useCallback(
    (item: T) => mutate((prev) => [item, ...prev]),
    [mutate],
  );
  const update = useCallback(
    (id: string, patch: Partial<T>) =>
      mutate((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    [mutate],
  );
  const remove = useCallback(
    (id: string) => mutate((prev) => prev.filter((it) => it.id !== id)),
    [mutate],
  );
  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setItems(seed);
  }, [key, seed]);

  return { items, add, update, remove, reset, hydrated };
}

// Short unique-ish id for client-created records.
export function localId(prefix = "loc"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
