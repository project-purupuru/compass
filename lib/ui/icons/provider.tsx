/**
 * IconRegistry · React Context provider + hook
 *
 * Wraps the app in a context that selects which IconProvider is active.
 * Per SDD §2.2: `lab.iconProvider` is persisted to sessionStorage (operator-toggle survives navigation, NOT tab-close).
 *
 * Usage:
 *   <IconProvider>
 *     <App />
 *   </IconProvider>
 *
 * To swap programmatically (e.g., from IconSwapToggle):
 *   const { provider, setProvider } = useIconProvider();
 *   setProvider("stub");
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { IconProviderId } from "./registry";

const STORAGE_KEY = "lab.iconProvider";
const DEFAULT_PROVIDER: IconProviderId = "phosphor";

interface IconProviderContextValue {
  provider: IconProviderId;
  setProvider: (next: IconProviderId) => void;
}

const IconProviderContext = createContext<IconProviderContextValue>({
  provider: DEFAULT_PROVIDER,
  setProvider: () => {},
});

export function IconProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<IconProviderId>(DEFAULT_PROVIDER);

  // Hydrate from sessionStorage on mount (client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved === "phosphor" || saved === "stub") {
        setProviderState(saved);
      }
    } catch {
      // sessionStorage unavailable (private mode etc.) — silently use default
    }
  }, []);

  const setProvider = useCallback((next: IconProviderId) => {
    setProviderState(next);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, next);
      } catch {
        // silent fail
      }
    }
  }, []);

  return (
    <IconProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </IconProviderContext.Provider>
  );
}

export function useIconProvider(): IconProviderContextValue {
  return useContext(IconProviderContext);
}
