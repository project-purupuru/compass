/**
 * Station — one element + sprite preview + per-station event triggers.
 *
 * 3D plane awareness (revised 2026-05-16): the stage container sets
 *   perspective: 900px;
 *   transform-style: preserve-3d;
 * so the puppet's rotateX hinge actually folds it forward/up in 3D camera
 * space (instead of just flattening it via 2D scaleY). The floor-shadow in
 * CardSummonEffect stays anchored to the ground plane while the puppet
 * pivots above it.
 *
 * Flip toggle = horizontal mirror for direction-facing previews.
 */

"use client";

import { useCallback, useState } from "react";

import { CardSummonEffect } from "../../_components/puppet/CardSummonEffect";
import {
  ELEMENT_LABELS,
  type ElementId,
} from "../../_components/puppet/JaniManifest";
import type { MotionConfig, PuppetState } from "../../_components/puppet/PaperPuppetMotion";

interface StationProps {
  readonly element: ElementId;
  readonly motion: MotionConfig;
  readonly globalState: PuppetState | null;
  readonly stickerSrc?: string;
  /** Pin the puppet to a specific sprite variant — exposes flex + puddle as their own stations. */
  readonly variant?: "normal" | "flex" | "puddle";
  /** Optional label suffix (e.g. "normal", "flex", "puddle") shown next to the element name. */
  readonly variantLabel?: string;
}

const VARIANT_GLYPH: Record<"normal" | "flex" | "puddle", string> = {
  normal: "·",
  flex: "·",
  puddle: "·",
};

const STATE_LABEL: Record<PuppetState, string> = {
  idle: "idle",
  walk: "walk",
  action: "action pose",
  summon: "summon",
  crumple: "crumple",
};

const EVENT_BUTTONS: readonly PuppetState[] = [
  "walk",
  "action",
  "summon",
  "crumple",
];

export function Station({
  element,
  motion,
  globalState,
  variant,
  variantLabel,
}: StationProps) {
  const [localState, setLocalState] = useState<PuppetState>("idle");
  const [flipX, setFlipX] = useState(false);
  const state = globalState ?? localState;

  const onSettle = useCallback(() => {
    setLocalState("idle");
  }, []);

  const trigger = useCallback((next: PuppetState) => {
    setLocalState(next);
  }, []);

  const stickerVisible = state === "summon" || state === "idle";

  return (
    <div
      data-testid={`station-${element}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "20px 16px",
        background: "var(--puru-cloud-bright)",
        border: "1px solid var(--puru-surface-border)",
        borderRadius: "var(--radius-md, 12px)",
        boxShadow: "var(--shadow-tile)",
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-puru-mono)",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--puru-ink-soft)",
        }}
      >
        {ELEMENT_LABELS[element]}
        {variantLabel ? (
          <span
            style={{
              marginLeft: 6,
              padding: "1px 6px",
              borderRadius: 999,
              background: `oklch(from var(--puru-${element}-vivid) l c h / 0.18)`,
              color: "var(--puru-ink-base)",
              letterSpacing: "0.15em",
            }}
          >
            {VARIANT_GLYPH[(variant ?? "normal") as "normal" | "flex" | "puddle"]}{" "}
            {variantLabel}
          </span>
        ) : null}
      </div>

      {/* THE STAGE — perspective container.
       *   perspective: depth of the implied camera (smaller = stronger 3D)
       *   perspective-origin: 50% 70% ≈ eye-level for a puppet on the floor
       *   preserve-3d: lets the puppet's rotateX hinge in real 3D space
       */}
      <div
        style={{
          width: 220,
          height: 260,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, transparent 55%, oklch(0.16 0.014 80 / 0.55) 92%, oklch(0.12 0.012 80 / 0.7) 100%)",
          borderRadius: "var(--radius-sm, 6px)",
          position: "relative",
          overflow: "hidden",
          perspective: `${motion.directionFlip.perspectivePx}px`,
          perspectiveOrigin: "50% 70%",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Subtle floor line (the implied ground plane). */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 26,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, oklch(0.4 0.012 80 / 0.4) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Ambient dust motes — the-easel §5 atom 4. The stage breathes between
         * puppet events. 4 motes with varied delays + paths. Hollow Knight's
         * screen-space dust is the canonical reference. */}
        {[
          { left: "22%", bottom: "20%", delay: "0s", duration: "13s" },
          { left: "55%", bottom: "35%", delay: "3.4s", duration: "16s" },
          { left: "78%", bottom: "18%", delay: "6.1s", duration: "14s" },
          { left: "38%", bottom: "48%", delay: "8.8s", duration: "17s" },
        ].map((m, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              left: m.left,
              bottom: m.bottom,
              width: 2,
              height: 2,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, oklch(0.95 0.04 80 / 0.85) 0%, oklch(0.95 0.04 80 / 0.4) 50%, transparent 70%)",
              filter: "blur(0.3px)",
              animation: `puru-mote-drift ${m.duration} ease-in-out ${m.delay} infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

        <CardSummonEffect
          element={element}
          motion={motion}
          state={state}
          height={160}
          stickerVisible={stickerVisible}
          flipX={flipX}
          forceVariant={variant}
          onSettle={onSettle}
        />

        {/* Universal paper grain overlay — the-easel §4 + vfx-playbook §3.1.
         * The asset /art/patterns/grain-warm.webp existed but was unused. Soft-light
         * blend mode is load-bearing (multiply reads as dirt, overlay as harsh,
         * soft-light as paper). Welds the whole frame to one painted material. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/art/patterns/grain-warm.webp)",
            backgroundSize: "256px 256px",
            mixBlendMode: "soft-light",
            opacity: 0.42,
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "var(--font-puru-mono)",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--puru-ink-dim)",
        }}
      >
        state · {STATE_LABEL[state]} {flipX ? "· flipped" : ""}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          width: "100%",
        }}
      >
        {EVENT_BUTTONS.map((evt) => (
          <button
            key={evt}
            type="button"
            onClick={() => trigger(evt)}
            disabled={globalState !== null}
            style={{
              padding: "8px 6px",
              fontFamily: "var(--font-puru-mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background:
                state === evt
                  ? `oklch(from var(--puru-${element}-vivid) l c h / 0.3)`
                  : "var(--puru-cloud-base)",
              color: "var(--puru-ink-base)",
              border: "1px solid var(--puru-surface-border)",
              borderRadius: "var(--radius-sm, 6px)",
              cursor: globalState ? "not-allowed" : "pointer",
              opacity: globalState ? 0.5 : 1,
            }}
          >
            {STATE_LABEL[evt]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFlipX((f) => !f)}
        style={{
          padding: "6px 10px",
          fontFamily: "var(--font-puru-mono)",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          background: flipX ? "var(--puru-honey-base)" : "var(--puru-cloud-base)",
          color: flipX ? "oklch(0.15 0.04 80)" : "var(--puru-ink-base)",
          border: "1px solid var(--puru-surface-border)",
          borderRadius: "var(--radius-sm, 6px)",
          cursor: "pointer",
          width: "100%",
        }}
      >
        ↔ flip {flipX ? "(left)" : "(right)"}
      </button>
    </div>
  );
}
