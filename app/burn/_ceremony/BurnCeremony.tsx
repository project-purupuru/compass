"use client";

/**
 * BurnCeremony — the 5-phase burn-rite state machine.
 *
 *   select → confirm → ceremony → reveal → done
 *
 * This client component owns the phase state and is the ONE place the
 * route reaches the Effect runtime (mirrors `app/battle/` → `runtime`
 * pattern, SDD §8). Phase responsibilities (SDD §8.3):
 *   - select   : reads `Collection.getAll()`, derives `getBurnCandidates`
 *   - confirm  : reads the selected candidate (gated on `.complete`)
 *   - ceremony : ANIMATION ONLY — zero substrate access (NFR-4)
 *   - reveal   : THE single mutation — `executeBurn` + `Collection.replaceAll`
 *   - done     : reads the refreshed collection, returns control
 *
 * NFR-4 — presentation never mutates substrate EXCEPT the one mutation at
 * the `ceremony → reveal` transition (see `runBurnMutation` below). The
 * `ceremony` component cannot mutate anything: it only runs timers and
 * calls `onComplete`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Effect } from "effect";
import type { BurnCandidate } from "@/lib/honeycomb/burn";
import { executeBurn, getBurnCandidates } from "@/lib/honeycomb/burn";
import type { Card } from "@/lib/honeycomb/cards";
import { Collection } from "@/lib/honeycomb/collection.port";
import type { Element } from "@/lib/honeycomb/wuxing";
import { runtime } from "@/lib/runtime/runtime";
import { CeremonyPhase } from "./CeremonyPhase";
import { ConfirmPhase } from "./ConfirmPhase";
import { DonePhase } from "./DonePhase";
import { RevealPhase } from "./RevealPhase";
import { SelectPhase } from "./SelectPhase";

type Phase = "select" | "confirm" | "ceremony" | "reveal" | "done";

/** What the `reveal` phase needs — captured eagerly before the ceremony. */
interface BurnResult {
  readonly transcendenceDefId: string;
  readonly resonance: number;
  readonly isLevelUp: boolean;
}

export function BurnCeremony() {
  const [phase, setPhase] = useState<Phase>("select");
  const [collection, setCollection] = useState<readonly Card[]>([]);
  const [selected, setSelected] = useState<BurnCandidate | null>(null);
  const [result, setResult] = useState<BurnResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Voice element for the caretaker whisper + a deterministic whisper seed.
  // The collection's first card seeds the element; mount-time seeds the line.
  const seedRef = useRef<number>(Date.now() % 997);

  /** Reads the live collection from the Collection service. */
  const refreshCollection = useCallback(async () => {
    const cards = await runtime.runPromise(
      Effect.flatMap(Collection, (c) => c.getAll()),
    );
    setCollection(cards);
    return cards;
  }, []);

  // `select` phase entry — load the collection (SDD §8.3).
  useEffect(() => {
    let alive = true;
    refreshCollection()
      .catch(() => {
        // localStorage unavailable / corrupt → empty collection, never crash
        // (SDD §10). The select phase then shows "nothing is ready".
        if (alive) setCollection([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refreshCollection]);

  // Dev-only: expose the collection seeders on `__PURU_DEV__` so a burnable
  // state is reachable from the console on `/burn` directly — mirrors
  // `DevConsole.installDevGlobal()`. Each seeder refreshes the live `select`
  // view so the dev loop is tight (seed → see it). Dead code in production.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let alive = true;
    void import("@/lib/honeycomb/collection.seed").then((seed) => {
      const w = globalThis as unknown as {
        __PURU_DEV__?: Record<string, unknown>;
      };
      const after = async () => {
        if (alive) await refreshCollection();
      };
      w.__PURU_DEV__ = {
        ...w.__PURU_DEV__,
        enabled: true,
        seedCompleteSet: async (
          setType: "jani" | "caretaker_a" | "caretaker_b",
        ) => {
          await seed.seedCompleteSet(setType);
          await after();
        },
        seedAllSets: async () => {
          await seed.seedAllSets();
          await after();
        },
        clearCollection: async () => {
          await seed.clearCollection();
          await after();
        },
      };
    });
    return () => {
      alive = false;
    };
  }, [refreshCollection]);

  const candidates = getBurnCandidates(collection);
  const voiceElement: Element = collection[0]?.element ?? "earth";

  // select → confirm
  const onSelect = useCallback((candidate: BurnCandidate) => {
    setSelected(candidate);
    setPhase("confirm");
  }, []);

  // confirm → ceremony. Input soft-locks here; `ceremony` has no exit.
  const onConfirm = useCallback(() => {
    setPhase("ceremony");
  }, []);

  // confirm → select (cancel)
  const onCancel = useCallback(() => {
    setSelected(null);
    setPhase("select");
  }, []);

  /**
   * THE SINGLE MUTATION POINT (NFR-4).
   *
   * Fired by `CeremonyPhase.onComplete` at the ~6s mark — the `ceremony →
   * reveal` transition. This is the ONLY place in the whole route that
   * mutates the substrate. State is captured eagerly here (not during the
   * ceremony timers): `executeBurn` is pure, `Collection.replaceAll`
   * persists, then we refresh and advance to `reveal`.
   */
  const runBurnMutation = useCallback(async () => {
    if (!selected) return;
    const playerCards = collection;
    const burnCards = selected.cards;
    const transDefId = selected.transcendenceDefId;

    try {
      const burn = executeBurn(playerCards, burnCards, transDefId);
      await runtime.runPromise(
        Effect.flatMap(Collection, (c) => c.replaceAll(burn.newCards)),
      );
      await refreshCollection();
      setResult({
        transcendenceDefId: transDefId,
        resonance: burn.transcendenceCard.resonance ?? 1,
        isLevelUp: burn.isLevelUp,
      });
      setPhase("reveal");
    } catch {
      // Quota-exceeded / persistence failure after the ceremony (SDD §10,
      // Q-4). The bond didn't hold — return to select rather than lose the
      // player in a dead phase.
      setSelected(null);
      setPhase("select");
    }
  }, [selected, collection, refreshCollection]);

  // reveal → done
  const onContinue = useCallback(() => {
    setPhase("done");
  }, []);

  // done → select (burn another)
  const onBurnAnother = useCallback(() => {
    setSelected(null);
    setResult(null);
    setPhase("select");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-puru-body text-sm text-puru-ink-dim">
          the embers warm…
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-puru-cloud-bright px-4 py-10">
      {phase === "select" && (
        <SelectPhase candidates={candidates} onSelect={onSelect} />
      )}

      {phase === "confirm" && selected && (
        <ConfirmPhase
          candidate={selected}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}

      {phase === "ceremony" && selected && (
        <CeremonyPhase candidate={selected} onComplete={runBurnMutation} />
      )}

      {phase === "reveal" && result && (
        <RevealPhase
          transcendenceDefId={result.transcendenceDefId}
          resonance={result.resonance}
          isLevelUp={result.isLevelUp}
          voiceElement={voiceElement}
          seed={seedRef.current}
          onContinue={onContinue}
        />
      )}

      {phase === "done" && (
        <DonePhase collection={collection} onBurnAnother={onBurnAnother} />
      )}
    </main>
  );
}
