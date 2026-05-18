"use client";

/**
 * ComboDiscoveryToast — first-time combo ceremony.
 *
 * Subscribes to match events. When a `combo-discovered` event fires with
 * `isFirstTime: true`, the toast appears center-screen for ~2.4s with the
 * combo's kanji, title, and subtitle from COMBO_META. Auto-dismisses on
 * timeout or click. Respects prefers-reduced-motion (no breathe, instant
 * in/out).
 *
 * CSS: app/battle/_styles/ComboDiscoveryToast.css
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ComboKind } from "@/lib/honeycomb/combos";
import { getComboMeta } from "@/lib/honeycomb/discovery";
import type { MatchEvent } from "@/lib/honeycomb/match.port";
import { useMatchEvent } from "@/lib/runtime/match.client";

const TOAST_DURATION_MS = 2400;

interface ToastState {
  readonly id: number;
  readonly kind: ComboKind;
}

export function ComboDiscoveryToast({
  onActiveChange,
}: {
  readonly onActiveChange?: (active: boolean) => void;
}) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const handler = useCallback((event: MatchEvent) => {
    if (event._tag !== "combo-discovered" || !event.isFirstTime) return;
    setToast({ id: Date.now(), kind: event.kind });
  }, []);
  const predicate = useCallback(
    (e: MatchEvent) => e._tag === "combo-discovered" && e.isFirstTime,
    [],
  );

  useMatchEvent(predicate, handler);

  useEffect(() => {
    if (!toast) {
      onActiveChange?.(false);
      return;
    }
    onActiveChange?.(true);
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toast, onActiveChange]);

  return (
    <div className="combo-toast" aria-live="polite" role="status">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.button
            key={toast.id}
            type="button"
            className="combo-toast-tile"
            data-kind={toast.kind}
            onClick={() => setToast(null)}
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            aria-label={`Combo discovered: ${getComboMeta(toast.kind).title}`}
          >
            <ComboTileBody kind={toast.kind} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComboTileBody({ kind }: { readonly kind: ComboKind }) {
  const meta = getComboMeta(kind);
  return (
    <>
      <span className="combo-toast-icon">{meta.icon}</span>
      <span className="combo-toast-title">{meta.title}</span>
      <span className="combo-toast-subtitle">{meta.subtitle}</span>
    </>
  );
}
