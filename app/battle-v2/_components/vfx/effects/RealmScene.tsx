/**
 * RealmScene — the composed "whole realm" preview.
 *
 * Session 17 latitude track: operator's reframe — "we need to start
 * composing these together into bigger scenes so that it starts to fill
 * up the actual map area in terms of size, because there are mountains
 * and things, this nature and landmarks that we need to add in."
 *
 * Shape:
 *   - 5 element zones (one per element) arranged in a pentagon
 *   - Each zone is a `patch-5` cluster carrying its element's ambient VFX
 *   - Mountain ring on the perimeter (cool low-poly)
 *   - Musubi Station silhouette to the north as a landmark anchor
 *   - Time-of-day atmosphere wears the whole scene (player-local clock)
 *   - Element-resonance modulates each zone's ambient intensity
 *
 * Reuses the same Wuxing substrate + ZoneAmbientVfx dispatch the
 * zone-scene effect uses. This is the "compose together" pattern: more
 * zones, same primitives, same atmosphere.
 *
 * Stays a sandbox — no biome decorators on the tiles yet (HexPlot
 * decorator integration is a future cycle); zones render as outlined hex
 * patches + element ambient + element glow disc.
 */

"use client";

import { useMemo } from "react";

import { Color } from "three";

import { makeZone, type ZoneT } from "@/lib/hex/zone";
import { SceneAtmosphere } from "@/lib/scene/atmosphere";
import {
  ElementAmbientVfx,
  type ElementAmbientProfile,
} from "@/lib/scene/elementAmbient";
import { useScenePhase } from "@/lib/scene/useScenePhase";
import {
  ALL_ELEMENTS,
  ELEMENT_META,
  type ElementIdT,
} from "@/lib/wuxing/element";
import { resonanceMultiplier } from "@/lib/wuxing/resonance";
import {
  PHASE_PALETTE,
  type TimeOfDayPhase,
} from "@/lib/wuxing/timeOfDay";

import type { RealmSceneConfigT } from "../VfxConfig";
import { HexOutline } from "./HexOutline";
import { MountainRing } from "./MountainRing";
import { MusubiSilhouette } from "./MusubiSilhouette";
import { PerfReadout } from "./PerfReadout";
import { PuruhaniWalker } from "./PuruhaniWalker";
import { ShengFlow } from "./ShengFlow";
import { ZoneMonument } from "./ZoneMonument";

// Pentagon layout — five anchor points around a center, one per element.
// Element ordering matches the sheng cycle so the pentagon walks the
// generative chain visually: wood (top) → fire (top-right) → earth
// (bottom-right) → metal (bottom-left) → water (top-left).
interface PentagonAnchor {
  readonly element: ElementIdT;
  readonly center: readonly [number, number];
}

function pentagonAnchors(radius: number): readonly PentagonAnchor[] {
  // Start at top (-PI/2) and walk clockwise.
  const startAngle = -Math.PI / 2;
  return ALL_ELEMENTS.map((element, i) => {
    const angle = startAngle + (i / 5) * Math.PI * 2;
    return {
      element,
      center: [Math.cos(angle) * radius, Math.sin(angle) * radius],
    };
  });
}

// ── Per-element ambient dispatch (mirrors ZoneScene) ──────────────────────

function ZoneAmbientFor({
  zone,
  hexSize,
  intensity,
  config,
}: {
  zone: ZoneT;
  hexSize: number;
  intensity: number;
  config: RealmSceneConfigT;
}) {
  if (intensity <= 0.01) return null;
  const seedBase = zone.coords.length;
  const profile: ElementAmbientProfile = {
    wood: {
      glow: { color: "#9bc77a", opacityBase: 0.3, opacityScale: 0.35 },
      leaf: {
        count: config.zoneLeafCount,
        palette: ["#6fae3e", "#82bd52", "#5a9836"],
        seed: 0x1ea1 ^ seedBase,
      },
      pollen: { count: config.zonePollenCount, seed: 0x90b6e7 ^ seedBase },
    },
    water: {
      glow: { color: "#3fa28a", opacityBase: 0.3, opacityScale: 0.35 },
      mist: { count: 14, color: "#7ab8b8", seed: 0xa15ed ^ seedBase },
      ripple: { count: 18, color: "#6fd6c0", seed: 0xb10dde ^ seedBase },
    },
    fire: {
      glow: { color: "#e85a4a", opacityBase: 0.3, opacityScale: 0.35 },
      ember: {
        count: config.zoneEmberCount,
        color: "#ff7a3a",
        seed: 0xf12e ^ seedBase,
      },
    },
    earth: {
      glow: { color: "#c69f5e", opacityBase: 0.3, opacityScale: 0.35 },
      dust: {
        count: config.zoneDustCount,
        color: "#c09060",
        seed: 0xea7138 ^ seedBase,
      },
    },
    metal: {
      glow: { color: "#b3a8c7", opacityBase: 0.3, opacityScale: 0.35 },
      spark: {
        count: config.zoneSparkCount,
        color: "#f0f4ff",
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

// ── Per-zone mount ────────────────────────────────────────────────────────

function ZoneMount({
  anchor,
  zone,
  hexSize,
  phase,
  config,
}: {
  anchor: readonly [number, number];
  zone: ZoneT;
  hexSize: number;
  phase: TimeOfDayPhase;
  config: RealmSceneConfigT;
}) {
  const intensity =
    config.ambientBase * resonanceMultiplier(zone.element, phase);
  return (
    <group position={[anchor[0], 0, anchor[1]]}>
      {config.showOutlines && (
        <HexOutline
          coords={zone.coords}
          size={hexSize}
          color={ELEMENT_META[zone.element].canonicalHue}
          opacity={config.outlineOpacity}
          yOffset={0.08}
        />
      )}
      {/* Center disc — element-tinted marker so the operator can identify
          which zone is which element from a top-down view. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[hexSize * 0.1, hexSize * 0.14, 32]} />
        <meshBasicMaterial
          color={ELEMENT_META[zone.element].canonicalHue}
          transparent
          opacity={0.65}
        />
      </mesh>
      <ZoneAmbientFor
        zone={zone}
        hexSize={hexSize}
        intensity={intensity}
        config={config}
      />
      {config.showPuruhani && (
        <PuruhaniWalker
          tiles={zone.coords}
          hexSize={hexSize}
          element={zone.element}
          heightWorld={hexSize * 0.55 * config.puruhaniScale}
          seed={0xb0b0 ^ zone.coords.length ^ zone.element.length}
        />
      )}
      {config.showMonuments && (
        <group position={[0, 0, 0]}>
          <ZoneMonument
            element={zone.element}
            hexSize={hexSize}
            scale={config.monumentScale}
          />
        </group>
      )}
    </group>
  );
}

// ── Ground plane ──────────────────────────────────────────────────────────

function GroundPlane({ phase }: { phase: TimeOfDayPhase }) {
  const tint = useMemo(() => {
    const base = new Color(PHASE_PALETTE[phase].fog);
    base.multiplyScalar(0.5);
    return `#${base.getHexString()}`;
  }, [phase]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color={tint} roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────

interface RealmScenePreviewProps {
  readonly config: RealmSceneConfigT;
  readonly triggerKey: number;
}

export function RealmScenePreview({
  config,
  triggerKey,
}: RealmScenePreviewProps) {
  void triggerKey;
  const phase = useScenePhase(config);

  const anchors = useMemo(
    () => pentagonAnchors(config.pentagonRadius),
    [config.pentagonRadius],
  );

  const zones = useMemo(
    () =>
      anchors.map((a) =>
        makeZone({
          id: `realm.zone.${a.element}`,
          element: a.element,
          center: { q: 0, r: 0 },
          shape: "patch-5",
        }),
      ),
    [anchors],
  );

  return (
    <group>
      <SceneAtmosphere
        phase={phase}
        fogDensity={config.fogDensity}
        fogNear={16}
        fogFar={60}
        keyPosition={[-12, 16, 8]}
        keyCastsShadow
        rimPosition={[-6, 12, -14]}
      />
      <GroundPlane phase={phase} />

      {config.showMountains && (
        <MountainRing
          outerRadius={config.mountainRadius}
          peakCount={32}
          color={
            phase === "night"
              ? "#2c3450"
              : phase === "evening"
                ? "#6a5f70"
                : "#5e6b7e"
          }
          peakHeight={config.mountainHeight}
        />
      )}

      {config.showLandmark && (
        <MusubiSilhouette
          position={[0, 0, -config.pentagonRadius * 1.8]}
          color={phase === "night" ? "#1c1f30" : "#3e3a44"}
          scale={1.4}
        />
      )}

      {config.showShengFlow && (
        <ShengFlow
          anchors={anchors}
          intensity={config.ambientBase}
          tubeRadius={Math.max(0.06, config.hexSize * 0.06)}
        />
      )}

      {anchors.map((a, i) => (
        <ZoneMount
          key={`zone-${i}`}
          anchor={a.center}
          zone={zones[i]}
          hexSize={config.hexSize}
          phase={phase}
          config={config}
        />
      ))}

      {config.debugPerf && <PerfReadout />}
    </group>
  );
}
