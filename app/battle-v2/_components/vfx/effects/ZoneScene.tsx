/**
 * ZoneScene — two-side elemental zone composer.
 *
 * Session 17 build doc: `grimoires/loa/specs/enhance-zone-scene-elemental-vfx.md`.
 *
 * Stage A scope: mount TWO empty zones (player + opponent) with no element
 * VFX yet. The scene atmosphere (sky, ambient light, directional key,
 * fog) responds to player-local time-of-day. Validates composition shape
 * before any particles ship.
 *
 * Operator framings the substrate honors:
 *   - "Player-local time is the scene's only clock." Whole scene wears
 *     that atmosphere. Opponent's element still drives THEIR cluster, but
 *     the sun isn't theirs.
 *   - "Calm awareness" — palette shift, never a sun-disc simulation.
 *   - "Two-side split is structural" — player + opponent are independent
 *     Side values that each carry an element + zones.
 *   - "More elements coming" — Side.element accepts any ElementIdT, even
 *     though session 17 only authors wood + water visuals.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Color } from "three";
import { useFrame } from "@react-three/fiber";

import { makeZone, type ZoneT } from "@/lib/hex/zone";
import { SceneAtmosphere } from "@/lib/scene/atmosphere";
import { ElementAmbientVfx, type ElementAmbientProfile } from "@/lib/scene/elementAmbient";
import { useScenePhase } from "@/lib/scene/useScenePhase";
import { ELEMENT_META, type ElementIdT } from "@/lib/wuxing/element";
import { resonanceMultiplier } from "@/lib/wuxing/resonance";
import { PHASE_PALETTE, type TimeOfDayPhase } from "@/lib/wuxing/timeOfDay";

import type { ZoneSceneConfigT } from "../VfxConfig";
import { HexOutline } from "./HexOutline";
import { PerfReadout } from "./PerfReadout";

// Wood palettes — kept inline so the composer doesn't need to reach across
// the cel-vocab module for a one-off picker. Canopy hues sourced from
// app/battle-v2/_components/world/palette.ts (PALETTE.canopyGreen /
// canopyAutumn).
const WOOD_LEAF_PALETTE = {
  green: ["#6fae3e", "#82bd52", "#5a9836", "#9bc77a"],
  autumn: ["#e0913a", "#d6a14a", "#c9722e", "#e6b340"],
} as const;

interface ZoneScenePreviewProps {
  readonly config: ZoneSceneConfigT;
  readonly triggerKey: number;
}

// ── Side model (runtime — not persisted as schema) ────────────────────────

interface SideRuntime {
  readonly id: "player" | "opponent";
  readonly element: ElementIdT;
  readonly zone: ZoneT;
  /** World-space anchor for the zone's center (xz plane). */
  readonly anchor: readonly [number, number];
}

// ── Per-side trigger ramp ─────────────────────────────────────────────────

/**
 * Trigger ramp: each counter-bump starts a fresh ramp from current to peak
 * (1.0) over `upSec`, then decays from peak back to `baseline` over
 * `decaySec`. Returns a ref whose `.current` field holds the multiplier
 * sampled this frame — caller multiplies their effective intensity by it
 * and reads on every render (we re-render once per useFrame via the
 * `rampVersion` state).
 *
 * NB: the ramp is sampled per-frame and stored in a ref to avoid re-
 * rendering every VFX child each frame. Each child reads its own intensity
 * computation from props that are themselves recomputed in the parent's
 * useFrame loop. Acceptable for Stage D — Stage E may move this onto a
 * uniform if perf becomes a concern.
 */
function useTriggerRamp(
  counter: number,
  baseline: number,
  upSec: number,
  decaySec: number,
): number {
  const startedAt = useRef<number | null>(null);
  const lastCounter = useRef(counter);
  const [t, setT] = useState(0);

  // Detect counter bump → start a fresh ramp. Skip the initial-mount run
  // (lastCounter.current === counter on first effect) so the scene doesn't
  // ramp on first paint.
  useEffect(() => {
    if (lastCounter.current === counter) return;
    lastCounter.current = counter;
    startedAt.current = performance.now() / 1000;
    setT(0);
  }, [counter]);

  useFrame(() => {
    if (startedAt.current === null) return;
    const elapsed = performance.now() / 1000 - startedAt.current;
    const total = upSec + decaySec;
    if (elapsed > total) {
      startedAt.current = null;
      setT(0);
      return;
    }
    setT(elapsed);
  });

  if (startedAt.current === null) return baseline;
  if (t <= upSec) {
    // Ramp up: baseline → 1.0 linearly over upSec.
    const k = t / Math.max(upSec, 1e-3);
    return baseline + (1 - baseline) * k;
  }
  // Decay: 1.0 → baseline over decaySec.
  const k = (t - upSec) / Math.max(decaySec, 1e-3);
  return 1 - (1 - baseline) * k;
}

// ── Ground plane (Stage A — neutral, awaiting biome variants) ─────────────

function GroundPlane({ phase }: { phase: TimeOfDayPhase }) {
  const tint = useMemo(() => {
    // Slightly darker than the sky-bottom so the ground reads as ground.
    const base = new Color(PHASE_PALETTE[phase].fog);
    base.multiplyScalar(0.55);
    return `#${base.getHexString()}`;
  }, [phase]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={tint} roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ── Per-side outline render ───────────────────────────────────────────────

// ── Per-side mount (anchor + outline + ambient + trigger ramp) ───────────

function SideMount({
  side,
  phase,
  config,
}: {
  side: SideRuntime;
  phase: TimeOfDayPhase;
  config: ZoneSceneConfigT;
}) {
  const baseline = config.ambientBase * resonanceMultiplier(side.element, phase);
  const counter = side.id === "player" ? config.playerRampCounter : config.opponentRampCounter;
  const intensity = useTriggerRamp(counter, baseline, config.rampUpSec, config.rampDecaySec);
  return (
    <group position={[side.anchor[0], 0, side.anchor[1]]}>
      <SideOutline
        side={side}
        hexSize={config.hexSize}
        showOutline={config.showOutline}
        outlineOpacity={config.outlineOpacity}
        embedded
      />
      <ZoneAmbientVfx
        zone={side.zone}
        hexSize={config.hexSize}
        intensity={intensity}
        config={config}
      />
    </group>
  );
}

// ── Per-element ambient dispatch ──────────────────────────────────────────

function ZoneAmbientVfx({
  zone,
  hexSize,
  intensity,
  config,
}: {
  zone: ZoneT;
  hexSize: number;
  intensity: number;
  config: ZoneSceneConfigT;
}) {
  if (intensity <= 0.01) return null;
  const seedBase = zone.coords.length;
  const woodPalette = WOOD_LEAF_PALETTE[config.woodFlavor] ?? WOOD_LEAF_PALETTE.green;
  const profile: ElementAmbientProfile = {
    wood: {
      leaf: {
        count: config.woodLeafCount,
        palette: woodPalette,
        seed: 0x1ea1 ^ seedBase,
      },
      pollen: { count: config.woodPollenCount, seed: 0x90b6e7 ^ seedBase },
    },
    water: {
      glow: { color: "#3fa28a", opacityBase: 0.35, opacityScale: 0.35 },
      mist: {
        count: config.waterMistCount,
        color: config.waterMistColor,
        seed: 0xa15ed ^ seedBase,
      },
      ripple: {
        count: config.waterRippleCount,
        color: config.waterRippleColor,
        seed: 0xb10dde ^ seedBase,
      },
    },
    fire: {
      glow: { color: config.fireGlowColor, opacityBase: 0.35, opacityScale: 0.35 },
      ember: {
        count: config.fireEmberCount,
        color: config.fireEmberColor,
        seed: 0xf12e ^ seedBase,
      },
    },
    earth: {
      glow: { color: config.earthGlowColor, opacityBase: 0.35, opacityScale: 0.35 },
      dust: {
        count: config.earthDustCount,
        color: config.earthDustColor,
        seed: 0xea7138 ^ seedBase,
      },
    },
    metal: {
      glow: { color: config.metalGlowColor, opacityBase: 0.35, opacityScale: 0.35 },
      spark: {
        count: config.metalSparkCount,
        color: config.metalSparkColor,
        seed: 0x5121 ^ seedBase,
      },
    },
  };

  return (
    <ElementAmbientVfx
      element={zone.element}
      tiles={zone.coords}
      hexSize={hexSize}
      intensity={intensity}
      profile={profile}
    />
  );
}

function SideOutline({
  side,
  hexSize,
  showOutline,
  outlineOpacity,
}: {
  side: SideRuntime;
  hexSize: number;
  showOutline: boolean;
  outlineOpacity: number;
  /** Reserved — current placement assumes parent group positions to anchor. */
  embedded?: boolean;
}) {
  // Parent group owns world-positioning to the side's anchor. SideOutline
  // renders only the per-side overlay marks (outline + center disc) in
  // zone-local hex coords.
  return (
    <>
      {showOutline && (
        <HexOutline
          coords={side.zone.coords}
          size={hexSize}
          color={ELEMENT_META[side.element].canonicalHue}
          opacity={outlineOpacity}
          yOffset={0.08}
        />
      )}
      {/* Center disc — element-tinted ring at the side's focal plot.
          Stays after Stage B until biome variants (Stage E) author monument
          structures (Konka Market stalls, Sunken Shrine gate). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[hexSize * 0.12, hexSize * 0.16, 32]} />
        <meshBasicMaterial
          color={ELEMENT_META[side.element].canonicalHue}
          transparent
          opacity={0.55}
        />
      </mesh>
    </>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────

export function ZoneScenePreview({ config, triggerKey }: ZoneScenePreviewProps) {
  // triggerKey reserved for Stage D ramp re-fire — Stage A: just rebuild zones.
  void triggerKey;

  const phase = useScenePhase(config);

  const player: SideRuntime = useMemo(
    () => ({
      id: "player",
      element: config.playerElement,
      zone: makeZone({
        id: "player.zone",
        element: config.playerElement,
        center: { q: 0, r: 0 },
        shape: config.clusterShape,
      }),
      anchor: [-config.sideOffset, 0],
    }),
    [config.playerElement, config.clusterShape, config.sideOffset],
  );

  const opponent: SideRuntime = useMemo(
    () => ({
      id: "opponent",
      element: config.opponentElement,
      zone: makeZone({
        id: "opponent.zone",
        element: config.opponentElement,
        center: { q: 0, r: 0 },
        shape: config.clusterShape,
      }),
      anchor: [config.sideOffset, 0],
    }),
    [config.opponentElement, config.clusterShape, config.sideOffset],
  );

  return (
    <group>
      <SceneAtmosphere
        phase={phase}
        fogDensity={config.fogDensity}
        fogNear={12}
        fogFar={38}
        keyPosition={[-6, 9, 5]}
        keyCastsShadow
        rimPosition={[-3, 6, -7]}
      />
      <GroundPlane phase={phase} />

      <SideMount side={player} phase={phase} config={config} />
      <SideMount side={opponent} phase={phase} config={config} />

      {config.debugPerf && <PerfReadout />}
    </group>
  );
}
