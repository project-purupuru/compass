/**
 * EntityPanel — selection-summoned identity panel, right side.
 *
 * Per build doc HUD slice: NOT always-on. Emptiness is structural — the panel
 * exists only while something is selected (an armed card, a hovered zone).
 * When selection clears, it dismisses itself; the right edge returns to void.
 *
 * Felt-state over raw numerals where possible (burn-rite NFR-2 lineage); any
 * numerals that do appear are monospace + tabular-nums and tick, never fade.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import type { ElementId } from "@/lib/purupuru/contracts/types";

export interface SelectedEntity {
  readonly kind: "card" | "zone";
  readonly name: string;
  readonly elementId: ElementId;
  readonly flavor: string;
  readonly stateLabel: string;
  readonly stateValue: string;
}

interface EntityPanelProps {
  readonly entity: SelectedEntity | null;
}

export function EntityPanel({ entity }: EntityPanelProps) {
  // Hold the last entity through the dismiss animation so the panel doesn't
  // pop out of existence — it leaves.
  const [shown, setShown] = useState<SelectedEntity | null>(entity);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (entity) {
      setShown(entity);
      setLeaving(false);
    } else if (shown) {
      setLeaving(true);
      timerRef.current = window.setTimeout(() => {
        setShown(null);
        setLeaving(false);
        timerRef.current = null;
      }, 200);
    }
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
    // `shown` is intentionally omitted — this effect reacts to `entity` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  if (!shown) return null;

  return (
    <aside className={`entity-panel${leaving ? " entity-panel--leaving" : ""}`}>
      <span className="entity-panel__kind">{shown.kind}</span>
      <span className="entity-panel__name">{shown.name}</span>
      <p className="entity-panel__flavor">{shown.flavor}</p>
      <div className="entity-panel__state">
        <span>{shown.stateLabel}</span>
        <span className="entity-panel__state-value">{shown.stateValue}</span>
      </div>
    </aside>
  );
}
