/**
 * PaperPuppet3D — the r3f renderer for paper-puppet janis IN THE WORLD.
 *
 * Same data layer as PaperPuppetSprite (DOM):
 *   - JaniManifest sprite-sheet metadata
 *   - MotionConfig.framePacing for stepped vs smooth
 *   - MotionConfig.directionFlip for rotateY hinge semantics
 *   - MotionConfig.{action,summon,crumple}Duration for timing
 *
 * Reuses the existing world-side SpriteSheetPlane primitive (which already
 * handles sprite-sheet UV cycling on a Three.js plane).
 *
 * Architecture mirrors the DOM two-face pattern:
 *   group (handles direction-flip via rotation.y lerp)
 *     ├ front face plane            (frame N, faces +Z)
 *     └ back face plane (rotateY π) (frame N or mirror, faces -Z)
 *
 * Direction-flip is a smooth rotation.y lerp toward target (0 or π).
 * Walk-cycle is JS-driven frame state on the front face's `frame` prop
 * (same TTYD 2-frame bg-swap pattern; no rotation during walk).
 * Key moments (action/summon/crumple) are driven by useFrame interpolation
 * with stepped pacing applied via `Math.floor(progress * steps) / steps`.
 *
 * Wrapping in <Billboard> from drei keeps the puppet camera-facing — direction-
 * flip rotation is applied to an inner group, billboard handles the outer
 * "always face camera" guarantee (Paper Mario billboard convention).
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, type Group, SRGBColorSpace } from "three";

import { SpriteSheetPlane } from "../world/SpriteSheetPlane";
import { JANI_MANIFEST, type ElementId, type SpriteSheet } from "./JaniManifest";
import type {
  FramePacing,
  LightDirection,
  MotionConfig,
  PuppetState,
} from "./PaperPuppetMotion";

// ─── Contact shadow ──────────────────────────────────────────────────────────
// Singleton canvas-backed POSTERIZED shadow texture — operator (2026-05-16):
// the outer world is mid-poly, the shadow should reflect that. Hard-stepped
// alpha bands + warm-dark tint (not pure black) read as hand-painted /
// stylized rather than Gaussian-blurred photoreal.
let _shadowTexture: CanvasTexture | null = null;
function getShadowTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (_shadowTexture) return _shadowTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Warm dark brown matches the Ghibli-warm ground (not pure black).
  const tint = "20, 14, 8"; // r,g,b — warm umber

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  // Two posterized bands with HARD STEPS — no Gaussian softness.
  // Inner band (0 → 0.50)   : near-uniform deep shade
  // Hard step at 0.50 → 0.52
  // Outer band (0.52 → 0.82): mid shade
  // Hard cutoff at 0.82 → 0.83
  grad.addColorStop(0, `rgba(${tint}, 0.62)`);
  grad.addColorStop(0.5, `rgba(${tint}, 0.58)`);
  grad.addColorStop(0.52, `rgba(${tint}, 0.32)`); // hard step
  grad.addColorStop(0.82, `rgba(${tint}, 0.28)`);
  grad.addColorStop(0.83, `rgba(${tint}, 0)`); // hard cutoff
  grad.addColorStop(1, `rgba(${tint}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  _shadowTexture = new CanvasTexture(canvas);
  _shadowTexture.colorSpace = SRGBColorSpace;
  return _shadowTexture;
}

interface ContactShadowProps {
  readonly footprintRadius: number; // world units, ellipse half-width
  readonly light: LightDirection;
}

/**
 * ContactShadow — a horizontal radial-gradient ellipse sitting on the ground.
 * Offset slightly toward where the light shadow casts (away from light source).
 * Stays planted on y≈0 — does NOT inherit the puppet's bounce / rotation.
 *
 * Reads as Octopath-style ground anchor: the puppet feels TOUCHED to the world
 * surface rather than floating above it.
 */
function ContactShadow({ footprintRadius, light }: ContactShadowProps) {
  const texture = useMemo(() => getShadowTexture(), []);
  if (!texture) return null;

  // Shadow falls in the direction OPPOSITE the light. CSS Y-down → r3f Z-into-
  // screen mapping: light.y < 0 ("above") → shadow extends forward (positive Z).
  const offsetX = -light.x * 0.1;
  const offsetZ = light.y * -0.1;

  // Ellipse: wider on X, narrower on Z (flatter when viewed at a slight angle).
  const width = footprintRadius * 1.6;
  const depth = footprintRadius * 0.95;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[offsetX, 0.005, offsetZ]}
      renderOrder={-2}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.78 * light.intensity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

interface PaperPuppet3DProps {
  /** World position [x, y, z]. y=0 places feet on the ground plane. */
  readonly position?: readonly [number, number, number];
  readonly element: ElementId;
  readonly variant?: "normal" | "flex" | "puddle";
  readonly motion: MotionConfig;
  readonly state: PuppetState;
  readonly flipX?: boolean;
  /** Height in world units, foot-to-ear. Default 1.4. */
  readonly worldHeight?: number;
  readonly onSettle?: () => void;
}

function pickSheet(
  element: ElementId,
  state: PuppetState,
  forceVariant?: "normal" | "flex" | "puddle",
): SpriteSheet {
  const variants = JANI_MANIFEST[element];
  if (forceVariant === "flex" && variants.flex) return variants.flex;
  if (forceVariant === "puddle" && variants.puddle) return variants.puddle;
  if (forceVariant === "normal") return variants.normal;
  if (state === "action" && variants.flex) return variants.flex;
  return variants.normal;
}

function applyStepping(progress: number, pacing: FramePacing | undefined): number {
  if (!pacing) return progress;
  if (pacing.mode !== "stepped") return progress;
  // jump-end semantics: progress 0 → 0; progress 1 → (N-1)/N at the very end,
  // 1.0 only briefly. Matches CSS steps(N, jump-end).
  return Math.min(1, Math.floor(progress * pacing.steps) / pacing.steps);
}

export function PaperPuppet3D({
  position = [0, 0, 0],
  element,
  variant,
  motion,
  state,
  flipX = false,
  worldHeight = 1.4,
  onSettle,
}: PaperPuppet3DProps) {
  /** outerGroup stays planted at the puppet's world `position` — contains the
   *  shadow disc as a SIBLING of the bounceGroup so the shadow never bounces. */
  const bounceGroupRef = useRef<Group>(null);
  const flipGroupRef = useRef<Group>(null);
  const sheet = pickSheet(element, state, variant);
  const aspect = sheet.frameWidth / sheet.frameHeight;
  const worldWidth = worldHeight * aspect;

  // Walk-cycle frame state (2-frame bg-swap, NOT rotation — TTYD canon).
  const [walkFrame, setWalkFrame] = useState(0);
  useEffect(() => {
    if (state !== "walk") {
      setWalkFrame(0);
      return;
    }
    const interval = window.setInterval(() => {
      setWalkFrame((f) => (f + 1) % sheet.frameCount);
    }, 1000 / motion.walkFps);
    return () => window.clearInterval(interval);
  }, [state, motion.walkFps, sheet.frameCount]);

  // Key-moment animation routing — onSettle fires after duration.
  const animStartRef = useRef<number>(0);
  const animStateRef = useRef<PuppetState>("idle");
  useEffect(() => {
    if (state === "idle" || state === "walk") {
      animStateRef.current = state;
      return;
    }
    animStartRef.current = performance.now() / 1000;
    animStateRef.current = state;
    const duration =
      state === "action"
        ? motion.actionDuration
        : state === "summon"
          ? motion.summonDuration
          : motion.crumpleDuration;
    const handle = window.setTimeout(() => onSettle?.(), duration * 1000);
    return () => window.clearTimeout(handle);
  }, [state, motion, onSettle]);

  // Direction-flip target (smooth lerp toward 0 or π).
  const targetFlipRotY = useMemo(() => (flipX ? Math.PI : 0), [flipX]);

  useFrame((s) => {
    const bounceGroup = bounceGroupRef.current;
    const flipGroup = flipGroupRef.current;
    if (!bounceGroup || !flipGroup) return;

    // Direction-flip: lerp rotation.y on the flip group (NOT the billboard).
    // Smooth 60fps regardless of stepped body pacing — flip is a single
    // transformation, not a cycle.
    const flipSpeed = 0.18;
    flipGroup.rotation.y += (targetFlipRotY - flipGroup.rotation.y) * flipSpeed;

    // Idle bounce — sine wave on Y of the bounce group ONLY.
    // The outer group + shadow stay planted at world position.
    const t = s.clock.getElapsedTime();
    if (state === "idle" || state === "walk") {
      const phase = (t / motion.idleBouncePeriod) * Math.PI * 2;
      const bounceWorld = (Math.sin(phase) * motion.idleBouncePx) / 80;
      bounceGroup.position.y = bounceWorld;
    } else {
      bounceGroup.position.y = 0;
    }

    // Key-moment animations — apply stepped pacing when configured.
    if (state === "action" || state === "summon" || state === "crumple") {
      const elapsed = performance.now() / 1000 - animStartRef.current;
      const duration =
        state === "action"
          ? motion.actionDuration
          : state === "summon"
            ? motion.summonDuration
            : motion.crumpleDuration;
      const rawProgress = Math.min(1, elapsed / duration);
      const progress = applyStepping(rawProgress, motion.framePacing[state]);

      if (state === "action") {
        // Pulse: scale peaks at 30%, returns to 1. Anticipation pre-squash 0-8%.
        let scaleDelta = 0;
        if (progress < 0.08) {
          scaleDelta = -0.05; // pre-squash
        } else if (progress < 0.3) {
          scaleDelta = ((progress - 0.08) / 0.22) * 0.14;
        } else if (progress < 0.55) {
          scaleDelta = 0.14 - ((progress - 0.3) / 0.25) * 0.16; // overshoot to -0.02
        } else if (progress < 0.78) {
          scaleDelta = -0.02 + ((progress - 0.55) / 0.23) * 0.05;
        } else {
          scaleDelta = 0.03 * (1 - (progress - 0.78) / 0.22);
        }
        flipGroup.scale.setScalar(1 + scaleDelta);
        flipGroup.rotation.x = 0;
      } else if (state === "crumple") {
        // Forward fold + slight forward shift + scale-down at end.
        const tiltDeg =
          progress < 0.1
            ? -6 * (progress / 0.1) // anticipation back-lean
            : progress < 0.25
              ? -6 + ((progress - 0.1) / 0.15) * 16 // -6 to 10
              : progress < 0.6
                ? 10 + ((progress - 0.25) / 0.35) * 60 // 10 to 70
                : progress < 0.82
                  ? 70 + ((progress - 0.6) / 0.22) * 25 // 70 to 95 (overshoot)
                  : progress < 0.9
                    ? 95 - ((progress - 0.82) / 0.08) * 7 // 95 to 88
                    : 88 + ((progress - 0.9) / 0.1) * 4; // 88 to 92
        flipGroup.rotation.x = (tiltDeg * Math.PI) / 180;
        const fadeScale = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
        flipGroup.scale.setScalar(fadeScale);
      } else if (state === "summon") {
        // Rise from flat: rotateX 92° → 0° with overshoot to -12° at 60%.
        let tiltDeg = 92;
        if (progress < 0.18) {
          tiltDeg = 92 - (progress / 0.18) * 12; // 92 → 80
        } else if (progress < 0.6) {
          tiltDeg = 80 - ((progress - 0.18) / 0.42) * 92; // 80 → -12 (overshoot)
        } else if (progress < 0.82) {
          tiltDeg = -12 + ((progress - 0.6) / 0.22) * 17; // -12 → 5
        } else {
          tiltDeg = 5 - ((progress - 0.82) / 0.18) * 5; // 5 → 0
        }
        flipGroup.rotation.x = (tiltDeg * Math.PI) / 180;
        const scaleUp = progress < 0.2 ? 0.85 + (progress / 0.2) * 0.15 : 1;
        flipGroup.scale.setScalar(scaleUp);
      }
    } else {
      flipGroup.rotation.x = 0;
      flipGroup.scale.setScalar(1);
    }
  });

  // Choose displayed frame: walk drives bg-swap, other states stay on frame 0
  // (or flex sprite for action — pickSheet handles the swap).
  const frame = state === "walk" ? walkFrame : 0;

  // Back face frame depends on directionFlip.backface mode.
  const backFrame =
    motion.directionFlip.backface === "frame2-direct"
      ? (frame + 1) % sheet.frameCount
      : frame;

  return (
    <group position={position}>
      {/* GROUND CONTACT SHADOW — horizontal, planted at y≈0, doesn't inherit
       * the puppet's bounce. Sibling of the bounce group. */}
      {motion.shadowEnabled ? (
        <ContactShadow footprintRadius={worldWidth * 0.5} light={motion.light} />
      ) : null}

      {/* BOUNCE GROUP — sine-wave Y offset for idle/walk life. */}
      <group ref={bounceGroupRef}>
        <Billboard follow={true}>
          <group ref={flipGroupRef}>
            {/* Lift inner geometry by worldHeight/2 so the sprite's bottom edge
             * sits at the flipGroup origin (y=0 = ground). The flipGroup's
             * rotation.x (used during crumple/summon) then pivots around the
             * FEET, matching the DOM transform-origin: 50% 100% convention. */}
            <group position={[0, worldHeight / 2, 0]}>
              {/* FRONT FACE — faces +Z (camera direction after billboard) */}
              <SpriteSheetPlane
                sheet={sheet}
                height={worldHeight}
                width={worldWidth}
                frame={frame}
                playing={false}
                name={`puppet3d-${element}-front`}
              />

              {/* BACK FACE — pre-rotated π around Y; visible when flipped */}
              {motion.directionFlip.backface !== "hidden" ? (
                <group rotation={[0, Math.PI, 0]}>
                  <SpriteSheetPlane
                    sheet={sheet}
                    height={worldHeight}
                    width={worldWidth}
                    frame={backFrame}
                    playing={false}
                    name={`puppet3d-${element}-back`}
                  />
                </group>
              ) : null}
            </group>
          </group>
        </Billboard>
      </group>
    </group>
  );
}
