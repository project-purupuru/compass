"use client";

/**
 * DevConsole — operator-tuning surface. FR-21.
 *
 * Hidden by default. Toggled via:
 *   · backtick (`) keypress (default · Quake-console mental model)
 *   · ?dev=1 URL query param (FR-22.5 fallback for AZERTY / extensions)
 *
 * Four tabs per Q-SDD-7:
 *   · kaironic   — DialKit-style timing tuners
 *   · substrate  — live Match.current highlights
 *   · seed       — current seed + replay input
 *   · combo      — per-position combo breakdown
 *
 * Mounted globally in app/battle/page.tsx · invisible during default render.
 * Per [[dev-tuning-separation]] memory: NOT in the game flow component tree.
 */

import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AudioPane } from "./AudioPane";
import { CameraPane } from "./CameraPane";
import { ComboDebug } from "./ComboDebug";
import { EventLogView } from "./EventLogView";
import { JuiceTweakpane } from "./JuiceTweakpane";
import { KaironicPanel } from "./KaironicPanel";
import { MechanicsInspector } from "./MechanicsInspector";
import { PhaseScrubber } from "./PhaseScrubber";
import { SeedReplayPanel } from "./SeedReplayPanel";
import { SnapshotJsonView } from "./SnapshotJsonView";
import { SubstrateInspector } from "./SubstrateInspector";
import { VfxPane } from "./VfxPane";

type Tab = "scrub" | "mech" | "juice" | "vfx" | "audio" | "camera" | "kaironic" | "substrate" | "seed" | "combo";

const TABS: readonly Tab[] = ["scrub", "mech", "vfx", "audio", "camera", "juice", "kaironic", "substrate", "seed", "combo"];

const STORAGE_KEY = "puru-dev-panel-enabled";

function readPersisted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writePersisted(open: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (open) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Install the global __PURU_DEV__ surface so dev:* commands are accepted. */
function installDevGlobal(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;
  // Eager import — we want a synchronous matchCommand handle so Playwright
  // can drive the state machine without dynamic imports inside page.evaluate.
  import("@/lib/runtime/match.client").then((m) => {
    (globalThis as { __PURU_DEV__?: unknown }).__PURU_DEV__ = {
      enabled: true,
      forcePhase: (phase: import("@/lib/honeycomb/match.port").MatchPhase) =>
        m.matchCommand.dispatch({ _tag: "dev:force-phase", phase }),
      injectSnapshot: (
        patch: Partial<import("@/lib/honeycomb/match.port").MatchSnapshot>,
      ) => m.matchCommand.dispatch({ _tag: "dev:inject-snapshot", patch }),
      beginMatch: (seed?: string) => m.matchCommand.beginMatch(seed),
      chooseElement: (element: import("@/lib/honeycomb/wuxing").Element) =>
        m.matchCommand.chooseElement(element),
      resetMatch: (seed?: string) => m.matchCommand.resetMatch(seed),
    };
  });
}

export function DevConsole() {
  const params = useSearchParams();
  // NODE_ENV gate — entire panel is dead code in production.
  if (process.env.NODE_ENV === "production") return null;

  const initialOpen = params?.get("dev") === "1" || readPersisted();
  const [open, setOpen] = useState(initialOpen);
  const [tab, setTab] = useState<Tab>("scrub");

  useEffect(() => {
    installDevGlobal();
  }, []);

  useEffect(() => {
    writePersisted(open);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Backtick toggle · ignore when typing in form fields
      if (
        e.key === "`" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setOpen((o) => !o);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="region"
          aria-label="Developer console"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed top-0 right-0 h-dvh w-[340px] z-[100] bg-puru-cloud-bright/95 backdrop-blur-sm shadow-puru-tile p-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-puru-display text-sm text-puru-ink-rich">DevConsole</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-2xs font-puru-mono text-puru-ink-soft hover:text-puru-ink-rich transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <nav className="flex gap-1 mb-3 border-b border-puru-cloud-deep/30 pb-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-2 py-1 rounded text-2xs font-puru-mono uppercase tracking-wide transition-colors ${
                  tab === t
                    ? "bg-puru-honey-base text-puru-ink-rich"
                    : "text-puru-ink-dim hover:text-puru-ink-rich"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="flex flex-col">
            {tab === "scrub" && (
              <>
                <PhaseScrubber />
                <EventLogView />
                <SnapshotJsonView />
              </>
            )}
            {tab === "mech" && <MechanicsInspector />}
            {tab === "juice" && <JuiceTweakpane />}
            {tab === "vfx" && <VfxPane />}
            {tab === "audio" && <AudioPane />}
            {tab === "camera" && <CameraPane />}
            {tab === "kaironic" && <KaironicPanel weights={emptyKaironic} />}
            {tab === "substrate" && <SubstrateInspector />}
            {tab === "seed" && <SeedReplayPanel />}
            {tab === "combo" && <ComboDebug />}
          </div>

          <footer className="mt-4 pt-3 border-t border-puru-cloud-deep/30 text-2xs font-puru-mono text-puru-ink-ghost">
            backtick to close · ?dev=1 to deep-link
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

const emptyKaironic = {
  arrival: 1.0,
  anticipation: 1.2,
  impact: 0.9,
  aftermath: 1.4,
  stillness: 1.6,
  recovery: 1.0,
  transition: 1.0,
};
