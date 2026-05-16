/**
 * PaperPuppetSprite — the DOM renderer for the motion-lab.
 *
 * Architecture (revised 2026-05-16 after operator clarified flip semantics):
 *
 *   walk        2-frame bg-position swap on the FRONT face (TTYD canon).
 *               No 3D rotation. Walking is locomotion, not flipping.
 *
 *   direction   rotateY hinge on the OUTER div, transitioned via CSS.
 *   flip        Triggers when flipX changes (manual or via direction-change
 *               event). Back face becomes the new front; the back's content
 *               depends on directionFlip.backface mode (mirror / frame2 /
 *               element-color-slice / hidden).
 *
 *   crumple/    Outer div animation (keyframe), overrides the direction-flip
 *   summon/     transition for the duration of the key-moment animation.
 *   action
 *
 * The 3D plane awareness comes from:
 *   - parent stage: perspective: <directionFlip.perspectivePx>; preserve-3d
 *   - puppet wrapper: transformStyle preserve-3d, transform-origin at feet
 *   - two-face sibling pattern: front face (frame N) + back face (mirror or
 *     element slice), backface-visibility hidden on both → exclusive
 *     visibility based on outer rotateY
 */

"use client";

import { useEffect, useRef, useState } from "react";

import {
  ELEMENT_BREATH_VAR,
  JANI_MANIFEST,
  type ElementId,
  type SpriteSheet,
} from "./JaniManifest";
import type { MotionConfig, PuppetState } from "./PaperPuppetMotion";

interface PaperPuppetSpriteProps {
  readonly element: ElementId;
  readonly motion: MotionConfig;
  readonly state: PuppetState;
  readonly height: number;
  readonly forceVariant?: "normal" | "flex" | "puddle";
  readonly stickerSrc?: string;
  /** When true, puppet is facing the opposite direction. Toggling animates the flip. */
  readonly flipX?: boolean;
  readonly onSettle?: () => void;
}

function pickSheet(
  element: ElementId,
  state: PuppetState,
  motion: MotionConfig,
  forceVariant?: "normal" | "flex" | "puddle",
): SpriteSheet {
  const variants = JANI_MANIFEST[element];
  if (forceVariant === "flex" && variants.flex) return variants.flex;
  if (forceVariant === "puddle" && variants.puddle) return variants.puddle;
  if (forceVariant === "normal") return variants.normal;
  // State-driven default: action → flex if available (snap-pose); else normal.
  // (Removed legacy `water + summon → puddle` heuristic: puddle is its own
  // station with its own motion vocab. Variant selection is explicit.)
  if (state === "action" && variants.flex) return variants.flex;
  return variants.normal;
}

const ELEMENT_SLICE_COLOR: Record<ElementId, string> = {
  wood: "oklch(0.85 0.170 112.7)",
  fire: "oklch(0.78 0.180 36)",
  earth: "oklch(0.84 0.160 85)",
  metal: "oklch(0.85 0.020 240)",
  water: "oklch(0.78 0.130 220)",
};

export function PaperPuppetSprite({
  element,
  motion,
  state,
  height,
  forceVariant,
  stickerSrc,
  flipX = false,
  onSettle,
}: PaperPuppetSpriteProps) {
  const sheet = pickSheet(element, state, motion, forceVariant);
  const aspect = sheet.frameWidth / sheet.frameHeight;
  const width = height * aspect;

  const [frame, setFrame] = useState(0);
  const tRef = useRef(0);
  const startRef = useRef<number | null>(null);

  // Walk-cycle = pure 2-frame background-position swap on the front face.
  // No 3D rotation during walk. The flip is a SEPARATE concern.
  useEffect(() => {
    if (state !== "walk") {
      setFrame(0);
      return;
    }
    const interval = window.setInterval(() => {
      setFrame((f) => (f + 1) % sheet.frameCount);
    }, 1000 / motion.walkFps);
    return () => window.clearInterval(interval);
  }, [state, motion.walkFps, sheet.frameCount]);

  // Event-state settle.
  useEffect(() => {
    if (state === "idle" || state === "walk") return;
    const duration =
      state === "action"
        ? motion.actionDuration
        : state === "summon"
          ? motion.summonDuration
          : motion.crumpleDuration;
    const handle = window.setTimeout(() => onSettle?.(), duration * 1000);
    return () => window.clearTimeout(handle);
  }, [state, motion, onSettle]);

  // Idle bounce + bend via rAF.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (state !== "idle" && state !== "walk") return;
    let raf = 0;
    const loop = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      tRef.current = (t - startRef.current) / 1000;
      setTick(tRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const bouncePhase = (tRef.current / motion.idleBouncePeriod) * Math.PI * 2;
  const bounceY = Math.sin(bouncePhase) * motion.idleBouncePx;
  const bendDeg = motion.bendEnabled
    ? Math.sin(bouncePhase * 0.5) * motion.bendDeg
    : 0;

  // Front-face bg-position based on current walk frame.
  const column = frame % sheet.columns;
  const row = Math.floor(frame / sheet.columns);
  const bgX = sheet.columns > 1 ? (column / (sheet.columns - 1)) * 100 : 0;
  const bgY = sheet.rows > 1 ? (row / (sheet.rows - 1)) * 100 : 0;
  const sizeX = sheet.columns * 100;
  const sizeY = sheet.rows * 100;

  // ── Outer div animation routing ──
  // Direction flip = transform: rotateY(0 or 180) + CSS transition (smooth turn).
  // Key moments (crumple/summon/action) = keyframe animation (overrides transform).
  //
  // The puddle variant gets its own `puddle-ooze` summon (spread-from-center on
  // the ground) instead of the standard rotateX rise — a puddle is already on
  // the floor and shouldn't stand up vertically.
  const isPuddle = forceVariant === "puddle";
  const effectiveSummonPattern = isPuddle ? "puddle-ooze" : motion.summonPattern;

  let outerAnimation: string | undefined;
  if (state === "crumple") {
    outerAnimation = `paper-crumple ${motion.crumpleDuration}s cubic-bezier(0.4, 0, 0.6, 1) forwards`;
  } else if (state === "summon") {
    outerAnimation = `paper-summon-${effectiveSummonPattern} ${motion.summonDuration}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
  } else if (state === "action") {
    outerAnimation = `paper-action ${motion.actionDuration}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
  }

  // The direction-flip rotation. Inactive (rotateY 0) when not flipped.
  // When flipX toggles, the CSS transition smoothly rotates 0 ↔ 180.
  const flipDeg = flipX ? 180 : 0;
  const directionFlipTransform = outerAnimation ? undefined : `rotateY(${flipDeg}deg)`;
  const directionFlipTransition = outerAnimation
    ? undefined
    : `transform ${motion.directionFlip.durationMs}ms ${motion.directionFlip.easing}`;

  // Ambient transforms apply to BOTH faces equally — handle via shared inner wrapper.
  const ambientTransform =
    `translateY(${(-bounceY).toFixed(2)}px) rotate(${bendDeg.toFixed(2)}deg)`;

  return (
    <div
      className="paper-puppet"
      data-state={state}
      data-variant={motion.variant}
      data-element={element}
      data-flipped={flipX ? "true" : "false"}
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        // Puddle pivots at center (it spreads outward, not from the feet).
        // All other puppets pivot at the feet for grounded rotation.
        transformOrigin: isPuddle
          ? "50% 50%"
          : `${motion.directionFlip.transformOriginX} ${motion.directionFlip.transformOriginY}`,
        transformStyle: "preserve-3d",
        animation: outerAnimation,
        transform: directionFlipTransform,
        transition: directionFlipTransition,
        ["--puppet-breath" as never]: `var(${ELEMENT_BREATH_VAR[element]})`,
      }}
    >
      {/* AMBIENT WRAPPER — bounce + bend, shared by both faces */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: ambientTransform,
          transformOrigin: "50% 100%",
          transformStyle: "preserve-3d",
        }}
      >
        {/* FRONT FACE — frame N, facing camera at rotateY(0°) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${sheet.src})`,
            backgroundSize: `${sizeX}% ${sizeY}%`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundRepeat: "no-repeat",
            transformOrigin: "50% 100%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            filter: motion.shadowEnabled
              ? "drop-shadow(0 2px 1px rgba(0,0,0,0.2))"
              : undefined,
          }}
        />

        {/* BACK FACE — appears when outer is rotated 180° (puppet faces opposite) */}
        {motion.directionFlip.backface !== "hidden" ? (
          <div
            style={
              motion.directionFlip.backface === "element-color-slice"
                ? {
                    position: "absolute",
                    inset: 0,
                    background: ELEMENT_SLICE_COLOR[element],
                    WebkitMaskImage: `url(${sheet.src})`,
                    maskImage: `url(${sheet.src})`,
                    WebkitMaskSize: `${sizeX}% ${sizeY}%`,
                    maskSize: `${sizeX}% ${sizeY}%`,
                    WebkitMaskPosition: `${bgX}% ${bgY}%`,
                    maskPosition: `${bgX}% ${bgY}%`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    transform: `rotateY(180deg)`,
                    transformOrigin: "50% 100%",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    opacity: 0.92,
                  }
                : {
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${sheet.src})`,
                    backgroundSize: `${sizeX}% ${sizeY}%`,
                    // mirror = front frame ; frame2-direct = next frame
                    backgroundPosition:
                      motion.directionFlip.backface === "frame2-direct"
                        ? `100% ${bgY}%`
                        : `${bgX}% ${bgY}%`,
                    backgroundRepeat: "no-repeat",
                    transform: `rotateY(180deg)`,
                    transformOrigin: "50% 100%",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    filter: motion.shadowEnabled
                      ? "drop-shadow(0 2px 1px rgba(0,0,0,0.2))"
                      : undefined,
                  }
            }
          />
        ) : null}

        {motion.stickerLayerEnabled && stickerSrc ? (
          <img
            src={stickerSrc}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              bottom: "10%",
              width: "30%",
              transform: `translateX(-50%) rotate(${bendDeg.toFixed(2)}deg)`,
              transformOrigin: "50% 100%",
              pointerEvents: "none",
              filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.25))",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
