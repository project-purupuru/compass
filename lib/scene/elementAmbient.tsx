"use client";

import { hexToWorld, type HexCoord } from "@/lib/hex";
import type { ElementIdT } from "@/lib/wuxing/element";

import { DustMotes } from "@/app/battle-v2/_components/vfx/effects/DustMotes";
import { Embers } from "@/app/battle-v2/_components/vfx/effects/Embers";
import { LeafSwirl } from "@/app/battle-v2/_components/vfx/effects/LeafSwirl";
import { Mist } from "@/app/battle-v2/_components/vfx/effects/Mist";
import { PollenMotes } from "@/app/battle-v2/_components/vfx/effects/PollenMotes";
import { RippleField } from "@/app/battle-v2/_components/vfx/effects/RippleField";
import { Sparks } from "@/app/battle-v2/_components/vfx/effects/Sparks";

interface GlowConfig {
  readonly color: string;
  readonly opacityBase: number;
  readonly opacityScale: number;
  readonly segments?: number;
}

interface LeafConfig {
  readonly count: number;
  readonly palette: readonly string[];
  readonly seed: number;
}

interface ParticleConfig {
  readonly count: number;
  readonly color?: string;
  readonly seed: number;
}

interface ElementAmbientConfig {
  readonly glow?: GlowConfig;
  readonly leaf?: LeafConfig;
  readonly pollen?: ParticleConfig;
  readonly mist?: ParticleConfig;
  readonly ripple?: ParticleConfig;
  readonly ember?: ParticleConfig;
  readonly dust?: ParticleConfig;
  readonly spark?: ParticleConfig;
}

export type ElementAmbientProfile = Partial<
  Record<ElementIdT, ElementAmbientConfig>
>;

export interface ElementAmbientVfxProps {
  readonly element: ElementIdT;
  readonly tiles: readonly HexCoord[];
  readonly hexSize: number;
  readonly intensity: number;
  readonly profile: ElementAmbientProfile;
}

export function ElementAmbientVfx({
  element,
  tiles,
  hexSize,
  intensity,
  profile,
}: ElementAmbientVfxProps) {
  if (intensity <= 0.01 || tiles.length === 0) return null;

  const config = profile[element];
  if (!config) return null;

  switch (element) {
    case "wood":
      return (
        <>
          <ElementGlow tiles={tiles} hexSize={hexSize} intensity={intensity} config={config.glow} />
          {config.leaf && (
            <LeafSwirl
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.leaf.count)}
              palette={config.leaf.palette}
              intensity={intensity}
              seed={config.leaf.seed}
            />
          )}
          {config.pollen && (
            <PollenMotes
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.pollen.count)}
              color={config.pollen.color}
              intensity={intensity}
              seed={config.pollen.seed}
            />
          )}
        </>
      );
    case "water":
      return (
        <>
          <ElementGlow tiles={tiles} hexSize={hexSize} intensity={intensity} config={config.glow} />
          {config.mist && (
            <Mist
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.mist.count)}
              color={config.mist.color}
              intensity={intensity}
              seed={config.mist.seed}
            />
          )}
          {config.ripple && (
            <RippleField
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.ripple.count)}
              color={config.ripple.color}
              intensity={intensity}
              seed={config.ripple.seed}
            />
          )}
        </>
      );
    case "fire":
      return (
        <>
          <ElementGlow tiles={tiles} hexSize={hexSize} intensity={intensity} config={config.glow} />
          {config.ember && (
            <Embers
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.ember.count)}
              color={config.ember.color}
              intensity={intensity}
              seed={config.ember.seed}
            />
          )}
        </>
      );
    case "earth":
      return (
        <>
          <ElementGlow tiles={tiles} hexSize={hexSize} intensity={intensity} config={config.glow} />
          {config.dust && (
            <DustMotes
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.dust.count)}
              color={config.dust.color}
              intensity={intensity}
              seed={config.dust.seed}
            />
          )}
        </>
      );
    case "metal":
      return (
        <>
          <ElementGlow tiles={tiles} hexSize={hexSize} intensity={intensity} config={config.glow} />
          {config.spark && (
            <Sparks
              tiles={tiles}
              hexSize={hexSize}
              count={roundedCount(config.spark.count)}
              color={config.spark.color}
              intensity={intensity}
              seed={config.spark.seed}
            />
          )}
        </>
      );
    default:
      return null;
  }
}

function roundedCount(count: number): number {
  return Math.max(0, Math.round(count));
}

function ElementGlow({
  tiles,
  hexSize,
  intensity,
  config,
}: {
  tiles: readonly HexCoord[];
  hexSize: number;
  intensity: number;
  config?: GlowConfig;
}) {
  if (!config) return null;

  const opacity =
    config.opacityBase + config.opacityScale * Math.max(0, Math.min(1, intensity));
  return (
    <>
      {tiles.map((coord, i) => {
        const [x, z] = hexToWorld(coord, hexSize);
        return (
          <mesh
            key={`glow-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.025, z]}
          >
            <circleGeometry args={[hexSize * 0.42, config.segments ?? 28]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={opacity}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </>
  );
}
