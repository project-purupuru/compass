/**
 * CardSummonEffect — the sticker-stamp + paper-jani pop-up hybrid + ground shadow.
 *
 * Operator's 1/3 hybrid (2026-05-16): card slap-stamps a sticker on the
 * ground, the sticker glows, a paper-jani peels up unfolding from it. The
 * sticker stays as the slot indicator. Sticker vocabulary carries across the
 * whole game.
 *
 * 3D plane awareness (revised 2026-05-16): the FLOOR SHADOW lives here as a
 * separate ellipse below the puppet's feet. It does NOT rotate with the
 * puppet — it stays anchored to the ground plane, scaling/fading on its own
 * keyframe to sell the "this puppet is standing on a surface" beat. The
 * puppet's parent Station sets perspective + preserve-3d for the rotateX
 * hinge to look 3D.
 */

"use client";

import { ELEMENT_LABELS, type ElementId } from "./JaniManifest";
import { PaperPuppetSprite } from "./PaperPuppetSprite";
import type { MotionConfig, PuppetState } from "./PaperPuppetMotion";

interface CardSummonEffectProps {
  readonly element: ElementId;
  readonly motion: MotionConfig;
  readonly state: PuppetState;
  readonly height: number;
  /** Show the lingering sticker indicator under the puppet. */
  readonly stickerVisible: boolean;
  /** Mirror the puppet horizontally. */
  readonly flipX?: boolean;
  /** Force a specific sprite variant — used by the motion-lab to expose flex + puddle as separate stations. */
  readonly forceVariant?: "normal" | "flex" | "puddle";
  readonly onSettle?: () => void;
}

/** Per-element vivid colour (mirrors --puru-*-vivid tokens). */
const ELEMENT_GLOW: Record<ElementId, string> = {
  wood: "oklch(0.85 0.170 112.7 / 0.45)",
  fire: "oklch(0.78 0.180 36 / 0.45)",
  earth: "oklch(0.84 0.160 85 / 0.45)",
  metal: "oklch(0.85 0.020 240 / 0.45)",
  water: "oklch(0.78 0.130 220 / 0.45)",
};

export function CardSummonEffect({
  element,
  motion,
  state,
  height,
  stickerVisible,
  flipX,
  forceVariant,
  onSettle,
}: CardSummonEffectProps) {
  // Floor-shadow animation key — matches the puppet's state-driven keyframe.
  // Puddle gets its own ooze-shaped shadow rather than the rise-from-flat one.
  const effectiveSummonPattern =
    forceVariant === "puddle" ? "puddle-ooze" : motion.summonPattern;
  const shadowAnimation =
    state === "crumple"
      ? `paper-shadow-crumple ${motion.crumpleDuration}s cubic-bezier(0.4, 0, 0.6, 1) forwards`
      : state === "summon"
        ? `paper-shadow-summon-${effectiveSummonPattern} ${motion.summonDuration}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
        : undefined;

  return (
    <div
      className="card-summon-effect"
      style={{
        position: "relative",
        height: `${height + 40}px`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* ── Ground shadow (anchored to floor, independent of puppet rotation) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          bottom: 12,
          width: `${height * 0.55}px`,
          height: `${height * 0.14}px`,
          transform: "translateX(-50%)",
          transformOrigin: "50% 50%",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 45%, transparent 80%)",
          borderRadius: "50%",
          filter: "blur(1.5px)",
          animation: shadowAnimation,
          pointerEvents: "none",
        }}
      />

      {/* ── Sticker glow underlay — visible during summon, fades to slot indicator */}
      {stickerVisible ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: 14,
            width: `${height * 0.45}px`,
            height: `${height * 0.12}px`,
            transform: "translateX(-50%)",
            background: `radial-gradient(ellipse at center, ${ELEMENT_GLOW[element]} 0%, transparent 70%)`,
            borderRadius: "50%",
            animation:
              state === "summon"
                ? `paper-sticker-glow ${motion.summonDuration}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
                : undefined,
            opacity: state === "summon" ? undefined : 0.4,
            filter: "blur(2px)",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* ── Confetti trail particles during summon */}
      {state === "summon"
        ? [...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dx = Math.cos(angle) * 36;
            const dy = Math.sin(angle) * 36 - 12;
            return (
              <span
                key={i}
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 18,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: ELEMENT_GLOW[element].replace("/ 0.45", "/ 0.9"),
                  ["--trail-dx" as never]: `${dx}px`,
                  ["--trail-dy" as never]: `${dy}px`,
                  animation: `paper-confetti-trail ${motion.summonDuration * 0.8}s ease-out ${
                    i * 0.02
                  }s forwards`,
                  pointerEvents: "none",
                }}
              />
            );
          })
        : null}

      {/* ── The paper puppet (rotates in 3D above the anchored shadow) */}
      <PaperPuppetSprite
        element={element}
        motion={motion}
        state={state}
        height={height}
        flipX={flipX}
        forceVariant={forceVariant}
        onSettle={onSettle}
      />

      <span className="sr-only">{ELEMENT_LABELS[element]}</span>
    </div>
  );
}
