"use client";

/**
 * BattleField — 1:1 port of world-purupuru BattleField.svelte.
 *
 * Layered map: detailed (entry) or flat (arena backdrop) · 5 territory
 * overlays · color-temperature · tide overlay · arena room (backdrop only) ·
 * ripple + spark VFX + hitstop flash. All styling lives in
 * app/battle/_styles/BattleField.css and applies via class names.
 */

import { useEffect, useRef, useState } from "react";
import { TERRITORY_CENTERS } from "@/lib/honeycomb/battlefield-geometry";
import type { Element } from "@/lib/honeycomb/wuxing";

export type BattleFieldAnimState = "idle" | "golden-hold" | "hitstop";
export type BattleFieldPhase = "selection" | "playing" | "result";

interface BattleFieldProps {
  readonly energies: Record<Element, number>;
  readonly turnElement: Element;
  readonly tide: number;
  readonly animState: BattleFieldAnimState;
  readonly phase: BattleFieldPhase;
  readonly weather: Element;
  readonly lastPlayed?: Element | null;
  readonly lastGenerated?: Element | null;
  readonly lastOvercome?: Element | null;
  readonly backdrop?: boolean;
  readonly arenaPhase?: string;
}

const DETAILED_MAP_URL = "/art/tsuheji-map.png";
const FLAT_MAP_URL = "/art/tsuheji-map.png";

export function BattleField({
  energies,
  turnElement,
  tide,
  animState,
  weather,
  backdrop = false,
  arenaPhase = "",
  lastPlayed = null,
  lastGenerated = null,
  lastOvercome = null,
}: BattleFieldProps) {
  const tideNormal = tide / 100;

  const wrapperCls = ["battlefield", backdrop && "backdrop", animState === "hitstop" && "hitstop"]
    .filter(Boolean)
    .join(" ");

  // Ripple + Shēng/Kè sparks fire whenever lastPlayed changes, and clear after
  // ~1.4s. Mirrors world-purupuru's golden-hold $effect.
  const [rippleKey, setRippleKey] = useState(0);
  const [sparkKey, setSparkKey] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [showSparks, setShowSparks] = useState(false);
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    const sig = `${lastPlayed}|${lastGenerated}|${lastOvercome}`;
    if (!lastPlayed || sig === lastSeenRef.current) return;
    lastSeenRef.current = sig;
    setRippleKey((k) => k + 1);
    setShowRipple(true);
    const sparkT = setTimeout(() => {
      setSparkKey((k) => k + 1);
      setShowSparks(true);
    }, 200);
    const clearT = setTimeout(() => {
      setShowRipple(false);
      setShowSparks(false);
    }, 1400);
    return () => {
      clearTimeout(sparkT);
      clearTimeout(clearT);
    };
  }, [lastPlayed, lastGenerated, lastOvercome]);

  const srcPos = lastPlayed ? TERRITORY_CENTERS[lastPlayed] : null;
  const genPos = lastGenerated ? TERRITORY_CENTERS[lastGenerated] : null;
  const overPos = lastOvercome ? TERRITORY_CENTERS[lastOvercome] : null;

  return (
    <div
      className={wrapperCls}
      data-arena-phase={arenaPhase}
      data-weather={weather}
      style={
        {
          "--e-wood": energies.wood,
          "--e-fire": energies.fire,
          "--e-earth": energies.earth,
          "--e-metal": energies.metal,
          "--e-water": energies.water,
          "--tide-n": tideNormal,
        } as React.CSSProperties
      }
    >
      {backdrop ? (
        <img className="map-flat" src={FLAT_MAP_URL} alt="" aria-hidden draggable={false} />
      ) : (
        <img className="map-detailed" src={DETAILED_MAP_URL} alt="Tsuheji continent" draggable={false} />
      )}

      <div className={`territory territory-wood${energies.wood > 0.35 ? " energized" : ""}`} />
      <div className={`territory territory-fire${energies.fire > 0.35 ? " energized" : ""}`} />
      <div className={`territory territory-earth${energies.earth > 0.35 ? " energized" : ""}`} />
      <div className={`territory territory-metal${energies.metal > 0.35 ? " energized" : ""}`} />
      <div className={`territory territory-water${energies.water > 0.35 ? " energized" : ""}`} />

      <div className="temperature" data-element={turnElement} />
      <div className="tide-overlay" />

      {backdrop && (
        <>
          <div className="arena-walls" />
          <div className="arena-canopy" />
        </>
      )}

      {showRipple && lastPlayed && (
        <div key={`ripple-${rippleKey}`} className="ripple" data-element={lastPlayed} />
      )}

      {showSparks && srcPos && genPos && overPos && lastGenerated && lastOvercome && (
        <>
          <div
            key={`gen-${sparkKey}`}
            className="spark spark-generate"
            data-element={lastGenerated}
            style={
              {
                "--src-x": `${srcPos.x}%`,
                "--src-y": `${srcPos.y}%`,
                "--end-x": `${genPos.x}%`,
                "--end-y": `${genPos.y}%`,
              } as React.CSSProperties
            }
          />
          <div
            key={`over-${sparkKey}`}
            className="spark spark-overcome"
            data-element={lastOvercome}
            style={
              {
                "--src-x": `${srcPos.x}%`,
                "--src-y": `${srcPos.y}%`,
                "--end-x": `${overPos.x}%`,
                "--end-y": `${overPos.y}%`,
              } as React.CSSProperties
            }
          />
        </>
      )}

      {animState === "hitstop" && <div className="hitstop-flash" />}
    </div>
  );
}
