"use client";

// Stone Recognition Ceremony — the bridge between the X-side mint and
// the in-world arrival. One-shot · plays once when the user lands on
// the observatory with `?welcome=<element>` and the per-element shown
// flag isn't set in localStorage. Premium reveal · zen restraint ·
// Disney 12-principles applied to a single hero asset.
//
// Reveal motion spec authored by KANSEI (studio synthesis · 2026-05-10).
// Migration-exit motion spec authored by KANSEI (2026-05-11).
// Spatial integration audited by ARTISAN (ALEXANDER · 2026-05-11).
// Spawn-pattern UX audited by THE ARCADE (BARTH · 2026-05-11).
// See `lib/ceremony/stone-copy.ts` for per-element content.
//
// ── Reveal sequence (1700ms total · indefinite dwell) ────────────────
//
//   Hush          0–180ms   Page dims, scrim fades, world canvas blurs.
//   Anticipation  180–360ms Stone-shaped void settles where the stone will be.
//   Crack         360–540ms A single hairline of element light traces upward.
//   Rise          540–1240ms Stone enters with arc + rotate, settles to 0.
//   Settle        1240–1480ms Asymmetric squash · element-weighted.
//   Inscribe      1300–1700ms Hairline → headline → flavor lines.
//   Dwell         1700ms+    Three desynchronized loops:
//                              • stone breath — translateY only
//                              • inner glow — period = breath × 1.7
//                              • drift particles — element-specific
//
// ── Migration exit (720ms total · "deposit IS spawn") ────────────────
//
//   On tap → handleDismiss → phase: "dwell" → "migrating".
//
//   Anticipation 0–60ms     Stone scales 1.0→0.94, halo intensity +15%,
//                            breath halts. Text fades simultaneously.
//   Launch       60–110ms   Stone scales 0.94→1.06 (squash-release),
//                            halo flares to 1.4× radius.
//   Travel       110–520ms  Asymmetric Bezier arc to wedge target.
//                            Scale 1.06 → 0.78 → 0.16 (slow up, fast down).
//                            Rotation 0° → -8° → +4° for solidity.
//                            Scrim backdrop-filter releases in parallel.
//   Crystallize  480–520ms  40ms held at apex-of-plunge.
//   Landing      520–600ms  Bloom + voice line + (deferred) sprite emerge.
//   Bloom-decay  600–720ms  Outer ripple fades.
//
//   Element-tuned travel duration multiplier (KANSEI §2):
//     fire 0.85× · wood 1.10× · earth 1.00× · metal 0.95× · water 1.15×
//
//   Phase machine: dwell → migrating → landed → done
//
//   The scrim's backdrop-filter ANIMATES from blur(20px) → blur(0)
//   instead of unmounting (ARTISAN: prevents Safari repaint flash on
//   filter unmount). Scrim opacity rides the same release.
//
// What this deliberately does NOT do:
//   ✗ No card chrome — stone alone on scrim, type rests the eye below
//   ✗ No theatrical entrance — no light rays, confetti, flash
//   ✗ No scale-based dwell breath — translate only (HoloCard discipline)
//   ✗ No particle/sparkle handoff at landing — the stone IS the sprite
//
// Persistence: a successful dismiss marks
// `localStorage.puru-stone-shown-{element}=1`. ObservatoryClient checks
// this before mounting; subsequent visits to ?welcome=fire skip
// straight to the world. Per-element so a user who later mints a
// second element gets the ceremony again.
//
// Deferred to follow-up work (operator dogfood the arc first):
//   - Ghost-YOU sprite for guest users (ARCADE+ARTISAN recommended ·
//     keeps the spawn promise honored for the 80% guest cohort)
//   - Sprite displacement around landing bloom (ARTISAN spec §6 ·
//     "nearby sprites step back to make room")
//   - YOU sprite auto-pulse for 2.4s post-spawn (ARCADE Q2)
//   - Profile preload + ceremony-aware spawnYou variant (ARTISAN Q4)

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Element } from "@/lib/score";
import { ELEMENT_BREATH_MS } from "@/lib/domain/element";
import {
  CEREMONY_DISMISS_LINE,
  STONE_COPY,
  hasStoneCeremonyBeenShown,
  markStoneCeremonyShown,
} from "@/lib/ceremony/stone-copy";
import { resolveWedgeViewportPoint } from "@/lib/ceremony/wedge-target";

interface Props {
  element: Element;
  /** Ref to the PentagramCanvas pane container — the migration target
   *  is computed against its bounding rect on dismiss. If the ref is
   *  null or the pane isn't rendered, the migration falls back to a
   *  scale-down-and-fade in place (graceful degradation). */
  pentagramPaneRef: React.RefObject<HTMLElement | null>;
  onDismiss: () => void;
}

// ── Per-element ambient signatures ──────────────────────────────────
// Each element has its own particle behavior, glow modulation, and
// migration-exit timing.

interface AmbientSig {
  /** Mote count — kept low; noise erodes ceremony. */
  count: number;
  /** Vertical drift in viewport units; negative = up, positive = falling. */
  driftY: number;
  /** Horizontal sway amplitude in px. */
  swayX: number;
  /** Mote travel duration range [min, max] in seconds. */
  durRange: readonly [number, number];
  /** Mote pixel size range [min, max]. */
  sizeRange: readonly [number, number];
  /** Glow modulation amplitude — 0 disables modulation (metal). */
  glowMod: number;
  /** Settle squash intensity multiplier — earth heavier, fire snappier. */
  squashWeight: number;
  /** Migration travel duration multiplier — KANSEI spec §2.
   *  Element temperament expressed through arc timing.
   *  fire eager · wood meandering · earth heavy · metal sharp · water flowing. */
  migrateMul: number;
  /** Vertical apex of migration arc in viewport units (vh).
   *  How high the stone lifts before plunging to the wedge. */
  migrateApexVh: number;
}

const AMBIENT: Record<Element, AmbientSig> = {
  wood: {
    count: 6,
    driftY: -1,
    swayX: 12,
    durRange: [10, 14],
    sizeRange: [2, 3.5],
    glowMod: 0.27,
    squashWeight: 1.0,
    migrateMul: 1.1,
    migrateApexVh: 20,
  },
  fire: {
    count: 7,
    driftY: -1,
    swayX: 6,
    durRange: [6, 9],
    sizeRange: [2, 4],
    glowMod: 0.32,
    squashWeight: 0.9,
    migrateMul: 0.85,
    migrateApexVh: 16,
  },
  earth: {
    count: 6,
    driftY: 1,
    swayX: 8,
    durRange: [12, 16],
    sizeRange: [2, 3.5],
    glowMod: 0.25,
    squashWeight: 1.15,
    migrateMul: 1.0,
    migrateApexVh: 14,
  },
  metal: {
    count: 2,
    driftY: -1,
    swayX: 4,
    durRange: [16, 22],
    sizeRange: [1.5, 2.5],
    glowMod: 0,
    squashWeight: 1.0,
    migrateMul: 0.95,
    migrateApexVh: 24,
  },
  water: {
    count: 5,
    driftY: -1,
    swayX: 18,
    durRange: [11, 15],
    sizeRange: [2, 3],
    glowMod: 0.22,
    squashWeight: 1.05,
    migrateMul: 1.15,
    migrateApexVh: 18,
  },
};

interface Mote {
  startX: number;
  delay: number;
  dur: number;
  size: number;
  swaySign: 1 | -1;
}

const ELEMENT_SEEDS: Record<Element, number> = {
  wood: 11,
  fire: 27,
  earth: 43,
  metal: 59,
  water: 71,
};

function buildMotes(seed: number, sig: AmbientSig): Mote[] {
  let state = seed * 9301 + 49297;
  const next = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  return Array.from({ length: sig.count }, () => ({
    startX: 8 + next() * 84,
    delay: next() * 4,
    dur: sig.durRange[0] + next() * (sig.durRange[1] - sig.durRange[0]),
    size: sig.sizeRange[0] + next() * (sig.sizeRange[1] - sig.sizeRange[0]),
    swaySign: next() > 0.5 ? 1 : -1,
  }));
}

// Phase machine — drives the post-tap sequence.
type Phase = "dwell" | "migrating" | "landed" | "done";

// Migration target captured on dismiss. Stays stable through the arc
// even if the canvas resizes (ARTISAN: snapshot on tap is correct
// for the 720ms window). dx/dy are deltas FROM screen-center to the
// wedge target — they feed motion.div's translate via x/y.
interface MigrationTarget {
  dx: number;
  dy: number;
  apexY: number; // negative — how high the arc peaks
}

const BASE_MIGRATE_MS = 410; // KANSEI baseline · earth = 1.00×
const LANDED_HOLD_MS = 320; // bloom + voice line dwell before unmount
//                            ~80ms landing + ~120ms bloom-decay + breathing
//                            room to read the voice line · KANSEI §1

export function StoneCeremony({ element, pentagramPaneRef, onDismiss }: Props) {
  const copy = STONE_COPY[element];
  const sig = AMBIENT[element];
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("dwell");
  const targetRef = useRef<MigrationTarget | null>(null);
  const motes = useMemo(() => buildMotes(ELEMENT_SEEDS[element], sig), [element, sig]);

  const migrateMs = Math.round(BASE_MIGRATE_MS * sig.migrateMul);
  const totalExitMs = migrateMs + LANDED_HOLD_MS;

  const handleDismiss = useCallback(() => {
    if (phase !== "dwell") return;
    markStoneCeremonyShown(element);

    // Compute migration target. The stone itself is positioned at
    // viewport-center via flex; the target is the wedge vertex on
    // the pentagram canvas. dx/dy are the deltas the motion.div
    // needs to translate to land on-target.
    const wedgePoint = resolveWedgeViewportPoint(pentagramPaneRef.current, element);
    if (wedgePoint) {
      const screenCx = window.innerWidth / 2;
      const screenCy = window.innerHeight / 2;
      const dx = wedgePoint.x - screenCx;
      const dy = wedgePoint.y - screenCy;
      // Apex = up by sig.migrateApexVh, slightly biased toward the
      // target side so the arc CURVES rather than peaks symmetrically
      // (KANSEI §2 element-tuning · water/wood lean lateral).
      const apexY = -window.innerHeight * (sig.migrateApexVh / 100);
      targetRef.current = { dx, dy, apexY };
    } else {
      // Pentagram pane not available — graceful fallback. Stone
      // scales-down-and-fades in place. ARTISAN doctrine: never
      // animate to garbage coordinates.
      targetRef.current = null;
    }

    setPhase("migrating");

    // Schedule landed → done. We don't wait on framer's onAnimationComplete
    // because the migration is a coordinated multi-element exit — the
    // scrim fade, the bloom, and the voice line all need synchronized
    // wallclock timing. Setting these as setTimeouts is more readable
    // and avoids per-element-callback timing drift.
    window.setTimeout(() => setPhase("landed"), migrateMs);
    window.setTimeout(() => {
      setPhase("done");
      onDismiss();
    }, totalExitMs);
  }, [phase, element, pentagramPaneRef, sig.migrateApexVh, migrateMs, totalExitMs, onDismiss]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleDismiss();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleDismiss]);

  const breathSec = ELEMENT_BREATH_MS[element] / 1000;
  const glowSec = breathSec * 1.7;

  // Don't render after the phase machine completes — onDismiss has
  // already fired and the parent will unmount us.
  if (phase === "done") return null;

  const isExiting = phase === "migrating" || phase === "landed";

  return (
    <motion.div
      key="ceremony"
      // cursor-pointer on the scrim signals the whole surface is
      // clickable. During exit, switch to default to avoid the user
      // tapping a stone that's mid-flight.
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isExiting ? "cursor-default" : "cursor-pointer"}`}
      // backdrop-filter rides phase-driven inline style (motion's
      // animate target type doesn't include backdropFilter). The
      // CSS transition on the style keeps the blur change smooth
      // without unmounting the scrim (ARTISAN §3 · prevents Safari
      // repaint flash).
      style={{
        // ── Three-layer ceremony atmosphere · ALEXANDER+KANSEI glow spec
        // 2026-05-11 (#ceremony-glow). Composes the canonical observatory
        // patterns:
        //   Layer 1 (TOP): element field · transparent center, edge-tinted
        //     vivid · borrowed from the leader-clan gradient at
        //     ObservatoryClient.tsx:289 ("the room is tinted by the element")
        //   Layer 2 (BOTTOM): ceremony-veil dimmer · theme-adaptive cool
        //     ink (NOT cloud-shadow which is hue-85 warm fog and would
        //     mix with cool elements into desert tan)
        //   Layer 3: stone halo · the existing -inset-12 vertex-aura
        //     behind the stone (StoneCeremony.tsx:436-463) keeps its
        //     honey-warm signature as the source mark
        // The veil token --ceremony-veil shifts per theme:
        //   light: oklch(0.18 0.020 80 / 0.92) cool dark ink
        //   dark:  oklch(0.06 0.006 80 / 0.94) true shadow
        // so element chroma reads the same atmospheric quality across both.
        background: `
          radial-gradient(ellipse 90% 80% at 50% 45%,
            color-mix(in oklch, var(--puru-${element}-vivid) 8%, transparent) 0%,
            transparent 60%
          ),
          radial-gradient(circle at 50% 55%,
            var(--ceremony-veil-core) 0%,
            var(--ceremony-veil-edge) 70%,
            var(--ceremony-veil-edge) 100%
          )
        `,
        backdropFilter:
          phase === "landed"
            ? "blur(0px) saturate(1)"
            : phase === "migrating"
              ? "blur(8px) saturate(0.7)"
              : "blur(20px) saturate(0.5)",
        WebkitBackdropFilter:
          phase === "landed"
            ? "blur(0px) saturate(1)"
            : phase === "migrating"
              ? "blur(8px) saturate(0.7)"
              : "blur(20px) saturate(0.5)",
        transition: `backdrop-filter ${phase === "landed" ? LANDED_HOLD_MS : 240}ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter ${phase === "landed" ? LANDED_HOLD_MS : 240}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: phase === "landed" ? 0 : 1,
      }}
      transition={{
        duration: phase === "landed" ? LANDED_HOLD_MS / 1000 : reduce ? 0.16 : 0.24,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={handleDismiss}
      onPointerDown={isExiting ? (e) => e.stopPropagation() : undefined}
    >
      {/* ── Drift particles · element-specific ambient motion ─── */}
      {!reduce && sig.count > 0 && !isExiting && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {motes.map((m, i) => {
            const startBottom = sig.driftY < 0 ? "-4%" : undefined;
            const startTop = sig.driftY > 0 ? "-4%" : undefined;
            const yKeyframes = sig.driftY < 0 ? [0, -1.2 * 800] : [0, 0.6 * 800];
            return (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${m.startX}%`,
                  bottom: startBottom,
                  top: startTop,
                  width: m.size,
                  height: m.size,
                  background: `var(--puru-${element}-vivid)`,
                  boxShadow: `0 0 ${m.size * 3.5}px var(--puru-${element}-vivid)`,
                  filter: "blur(0.5px)",
                }}
                initial={{ y: 0, x: 0, opacity: 0 }}
                animate={{
                  y: yKeyframes,
                  x: [0, m.swaySign * sig.swayX, -m.swaySign * sig.swayX * 0.6, 0],
                  opacity: [0, 0.55, 0.45, 0],
                }}
                transition={{
                  duration: m.dur,
                  delay: m.delay + 0.6,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.18, 0.78, 1],
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Card group · stops at dwell · the stone migrates out
            during exit. */}
      <motion.div className="relative flex flex-col items-center">
        {/* Reveal-only beats: Crack + Anticipation void. Hidden once
            exit begins — they're stage-setting, not part of departure. */}
        {!reduce && !isExiting && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: "55%",
              width: 1.5,
              height: 80,
              background: `linear-gradient(to top, transparent, var(--puru-${element}-vivid), color-mix(in oklch, var(--puru-honey-bright) 60%, white) 80%, transparent)`,
              boxShadow: `0 0 14px var(--puru-${element}-vivid)`,
              transformOrigin: "bottom",
            }}
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={{ opacity: [0, 0.95, 0], scaleY: [0.3, 1, 1.1] }}
            transition={{
              duration: 0.18,
              delay: 0.36,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.55, 1],
            }}
          />
        )}

        {!reduce && !isExiting && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              width: 220,
              height: 220,
              background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, oklch(0.04 0.008 80) 35%, transparent) 0%, transparent 70%)`,
              filter: "blur(12px)",
              transform: "translateY(-30px)",
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 0.4, 0], scale: [0.92, 1, 1] }}
            transition={{ duration: 0.36, delay: 0.18, ease: [0.4, 0, 0.6, 1], times: [0, 0.5, 1] }}
          />
        )}

        {/* ── Stone — the hero asset · migrates to wedge on exit ─── */}
        <motion.div
          className="relative h-[300px] w-[260px] sm:h-[360px] sm:w-[300px]"
          // Reveal entry · pose-to-pose Rise + Settle.
          initial={{
            opacity: 0,
            y: reduce ? 0 : 36,
            x: 0,
            rotate: reduce ? 0 : -1.5,
            scale: reduce ? 1 : 0.94,
          }}
          animate={
            isExiting && targetRef.current
              ? {
                  // ── Migration arc · KANSEI §2 ──
                  // x/y as keyframe arrays trace the asymmetric Bezier:
                  //   start (0,0) → apex (mid + apexY) → wedge (dx, dy)
                  // times asymmetric: 0 → 0.42 (rise) → 1 (plunge).
                  // Scale collapses 1.06 → 0.78 → 0.16 over the same
                  // segments. Rotation -8° → +4° wobble for solidity.
                  x: [0, targetRef.current.dx * 0.42, targetRef.current.dx],
                  y: [
                    0,
                    targetRef.current.apexY + targetRef.current.dy * 0.42,
                    targetRef.current.dy,
                  ],
                  scale: [1.06, 0.78, 0.16],
                  rotate: [0, -8, 4],
                  opacity: phase === "landed" ? 0 : 1,
                }
              : isExiting
                ? {
                    // Fallback: scale + fade in place when no target.
                    scale: 0.4,
                    opacity: 0,
                    y: 0,
                    x: 0,
                    rotate: 0,
                  }
                : {
                    // Reveal Rise + Settle keyframes.
                    opacity: [0, 1, 1, 1, 1],
                    y: [36, 0, 0, 0, 0],
                    x: [0, 6, -3, 0, 0],
                    rotate: [-1.5, 0, 0, 0, 0],
                    scaleY: [0.94, 1, 1 - 0.04 * sig.squashWeight, 1 + 0.015 * sig.squashWeight, 1],
                    scaleX: [0.94, 1, 1 + 0.03 * sig.squashWeight, 1 - 0.008 * sig.squashWeight, 1],
                  }
          }
          transition={
            isExiting
              ? {
                  duration: migrateMs / 1000,
                  ease: "easeInOut",
                  times: targetRef.current ? [0, 0.42, 1] : undefined,
                  opacity: {
                    duration: 0.16,
                    delay: phase === "landed" ? 0 : (migrateMs - 80) / 1000,
                  },
                }
              : reduce
                ? { duration: 0.18, delay: 0.06, ease: "easeOut" }
                : {
                    duration: 0.94,
                    delay: 0.54,
                    ease: [0.34, 1.04, 0.42, 1],
                    times: [0, 0.3, 0.74, 0.86, 1],
                  }
          }
          style={{ transformOrigin: "50% 100%" }}
        >
          {/* Halo behind stone · independent glow modulation period
              (incommensurate-period rule, KANSEI §3). During exit
              the halo travels with the stone but at 1.3× scale so
              it appears to "consume" the stone visually. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-12"
            style={{
              background: `radial-gradient(circle at 50% 60%, color-mix(in oklch, var(--puru-${element}-vivid) 38%, transparent) 0%, color-mix(in oklch, var(--puru-honey-base) 24%, transparent) 26%, transparent 65%)`,
              filter: "blur(14px)",
            }}
            initial={{ opacity: 0 }}
            animate={
              isExiting
                ? { opacity: phase === "landed" ? 0 : 0.6, scale: 1.3 }
                : reduce || sig.glowMod === 0
                  ? { opacity: 0.55 }
                  : {
                      opacity: [0.4, 0.4 + sig.glowMod, 0.4, 0.4 + sig.glowMod * 0.7, 0.4],
                    }
            }
            transition={
              isExiting
                ? { duration: 0.16, ease: "easeOut" }
                : reduce || sig.glowMod === 0
                  ? { duration: 0.4, delay: 0.6 }
                  : {
                      duration: glowSec,
                      delay: 1.0,
                      repeat: Infinity,
                      ease: [0.45, 0.05, 0.55, 0.95],
                    }
            }
          />

          {/* Inner: the stone breathes via translateY only (during dwell).
              During exit, the breath is frozen — the stone has more
              important business. */}
          <motion.div
            className="absolute inset-0 flex items-end justify-center"
            animate={reduce || isExiting ? undefined : { y: [0, -3, 0] }}
            transition={
              reduce || isExiting
                ? undefined
                : {
                    duration: breathSec,
                    delay: 1.6,
                    repeat: Infinity,
                    ease: [0.45, 0.05, 0.55, 0.95],
                  }
            }
          >
            <Image
              src={`/art/stones/transparent/${element}.png`}
              alt={`${copy.headline} stone`}
              width={420}
              height={500}
              priority
              className="h-auto w-[220px] sm:w-[260px]"
              style={{
                filter: `drop-shadow(0 18px 28px color-mix(in oklch, var(--puru-${element}-vivid) 32%, transparent)) drop-shadow(0 6px 10px oklch(0.06 0.008 80 / 0.45))`,
              }}
            />
          </motion.div>
        </motion.div>

        {/* ── Type stack · fades immediately on exit ─────────────── */}
        <motion.div
          className="flex cursor-default flex-col items-center"
          onClick={(e) => e.stopPropagation()}
          animate={isExiting ? { opacity: 0, y: -4 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          {/* Operator note 2026-05-11: bridge eyebrow + hairline
              ornament both dropped (too much chrome below the stone).
              The element-energy halo around the stone is the only
              ornament; the type stack rests below at clean spacing. */}

          {/* Headline · element-color text matching the kanji glow on
              the stone. Operator decision 2026-05-11 — color makes the
              element identity legible at a glance and composes with the
              molten kanji + element atmosphere. Drop-shadow gives the
              text its own glow so it reads against any backdrop tint. */}
          {/* Headline · element-vivid lifted toward white (92% mix) for
              luminosity against the dim sanctum, with two-layer
              shadow per ALEXANDER spec:
                · 1px hard dark drop = legibility anchor (THE thing
                  that makes it readable, not the bloom)
                · 18px element glow at 55% = inner halo
                · 36px element glow at 28% = soft outer bloom
              Capped at 36px outer to avoid Photoshop-layer-style
              over-glow that breaks the Hades restraint. */}
          <motion.h2
            className="mt-12 font-puru-display text-[2.75rem] leading-none capitalize"
            style={{
              color: `color-mix(in oklch, var(--puru-${element}-vivid) 92%, white)`,
              textShadow: `0 1px 0 oklch(0.04 0.006 80 / 0.85), 0 0 18px color-mix(in oklch, var(--puru-${element}-vivid) 55%, transparent), 0 0 36px color-mix(in oklch, var(--puru-${element}-vivid) 28%, transparent)`,
              letterSpacing: "0.01em",
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0.16 : 1.36 }}
          >
            {copy.headline}
          </motion.h2>

          {/* Flavor · explicit warm cream so it reads against the dim
              sanctum in BOTH modes. text-puru-ink-base would be dark
              in light mode (invisible against the new dark veil). */}
          <div className="mt-5 flex flex-col items-center gap-1.5 px-6 text-center">
            {copy.flavor.map((line, i) => (
              <motion.p
                key={i}
                className="text-base sm:text-lg"
                style={{ color: "oklch(0.86 0.010 85)" }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.36,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduce ? 0.22 + i * 0.04 : 1.44 + i * 0.08,
                }}
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* Dismiss prompt · explicit cream-dim color so it reads
              against the dim sanctum in BOTH modes. */}
          <motion.button
            type="button"
            onClick={handleDismiss}
            className="group mt-10 cursor-pointer font-puru-mono text-[10px] uppercase tracking-[0.32em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-puru-honey-base"
            style={{ color: "oklch(0.72 0.010 85)" }}
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0.75 } : { opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: reduce ? 0.32 : 1.8 }}
            aria-label={CEREMONY_DISMISS_LINE}
          >
            <motion.span
              animate={reduce ? undefined : { opacity: [0.55, 0.85, 0.55] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 3.2, delay: 2.3, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] }
              }
              className="inline-block transition-colors group-hover:text-white"
            >
              {CEREMONY_DISMISS_LINE}
            </motion.span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ── Landing voice line · "{element}. you're in." ──────────
          Lands at the wedge target during the bloom phase. ARCADE
          spec: completes the second-person voice arc and gives the
          dashboard voice permission to be clinical because you've
          already been spoken to as you. Six syllables, 320ms hold,
          fade-out. Anchored at the wedge in viewport coords so it
          appears AT the landing point, not center. */}
      <AnimatePresence>
        {phase === "landed" && targetRef.current && (
          <motion.div
            key="landing-voice"
            className="pointer-events-none fixed font-puru-display text-[1.5rem] leading-none"
            style={{
              left: `calc(50vw + ${targetRef.current.dx}px)`,
              top: `calc(50vh + ${targetRef.current.dy + 28}px)`,
              transform: "translate(-50%, 0)",
              color: `var(--puru-${element}-vivid)`,
              textShadow: `0 0 14px color-mix(in oklch, var(--puru-${element}-vivid) 70%, transparent), 0 1px 0 oklch(0.06 0.008 80 / 0.4)`,
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {copy.headline}. you're in.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Landing bloom · two-layer · KANSEI §5 ──────────────────
          Inner element-vivid burst (sharp impact) + outer honey
          ripple (the world received you). Anchored at wedge target
          in viewport coords. The bloom decoupled from the stone's
          terminal opacity so the arrival "lands" even if scale is
          mid-collapse (KANSEI §9: position-trigger, not scale-trigger). */}
      <AnimatePresence>
        {phase === "landed" && targetRef.current && (
          <>
            <motion.div
              key="bloom-inner"
              aria-hidden
              className="pointer-events-none fixed rounded-full"
              style={{
                left: `calc(50vw + ${targetRef.current.dx}px)`,
                top: `calc(50vh + ${targetRef.current.dy}px)`,
                width: 200,
                height: 200,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--puru-${element}-vivid) 60%, transparent) 0%, color-mix(in oklch, var(--puru-${element}-vivid) 25%, transparent) 30%, transparent 70%)`,
                filter: "blur(8px)",
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0.95, 0.6, 0], scale: [0.4, 1, 1.2] }}
              transition={{ duration: 0.6, ease: "easeOut", times: [0, 0.4, 1] }}
            />
            <motion.div
              key="bloom-outer"
              aria-hidden
              className="pointer-events-none fixed rounded-full"
              style={{
                left: `calc(50vw + ${targetRef.current.dx}px)`,
                top: `calc(50vh + ${targetRef.current.dy}px)`,
                width: 480,
                height: 480,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--puru-honey-base) 30%, transparent) 0%, color-mix(in oklch, var(--puru-honey-tint) 15%, transparent) 35%, transparent 70%)`,
                filter: "blur(16px)",
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0.5, 0.35, 0], scale: [0.6, 1.2, 1.8] }}
              transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.3, 1], delay: 0.04 }}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper consumed by ObservatoryClient — should we render the ceremony
// for the current visit? Reads the URL ?welcome param + per-element
// shown flag. Returns the element to celebrate, or null.
export function readWelcomeElement(): Element | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("welcome")?.toLowerCase();
  if (!raw) return null;
  const VALID: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];
  if (!VALID.includes(raw as Element)) return null;
  const el = raw as Element;
  if (hasStoneCeremonyBeenShown(el)) return null;
  return el;
}
