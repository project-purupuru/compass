/**
 * UltimateScreen — full-screen takeover overlay for the 5-chain wuxing
 * ultimate moment.
 *
 * Per build doc (`grimoires/loa/specs/enhance-card-to-map-choreography.md`):
 * "full 5-card wuxing chain: ultimate-style screen takeover with custom
 * animation before final hit resolves." This is the LEGENDARY moment —
 * the brush-stroke text takes ⅓ screen, the rest of the world dims to
 * deepen the silhouette + draw the eye to the text.
 *
 * Composition:
 *   - A near-black radial vignette darkens the periphery → focuses the
 *     center where the typography fires
 *   - A subtle element-tinted aurora wisps in from above and below
 *     (gradient bands) — adds atmospheric weight without obscuring text
 *   - Phase-driven entry/hold/exit matches the ultimate-chain typography
 *     animation spec so the takeover lifts and falls with the text
 */

"use client";

import { useEffect, useState } from "react";

interface UltimateScreenProps {
  /** When true, animate in. When false, animate out. */
  readonly active: boolean;
  /** Auto-dismiss after this many seconds (matches ultimate-chain anim). */
  readonly durationSec?: number;
  /** Optional element-affinity hue for the aurora tint. */
  readonly accentHex?: string;
  readonly onDone?: () => void;
}

export function UltimateScreen({
  active,
  durationSec = 2.1,
  accentHex = "#e8a040",
  onDone,
}: UltimateScreenProps) {
  const [phase, setPhase] = useState<"hidden" | "entering" | "held" | "exiting">("hidden");

  useEffect(() => {
    if (!active) {
      if (phase === "held" || phase === "entering") setPhase("exiting");
      return;
    }
    // active=true: cycle entering → held → exiting → hidden
    setPhase("entering");
    const enterEnd = window.setTimeout(() => setPhase("held"), 220);
    const holdEnd = window.setTimeout(() => setPhase("exiting"), 220 + durationSec * 1000);
    const exitEnd = window.setTimeout(() => {
      setPhase("hidden");
      onDone?.();
    }, 220 + durationSec * 1000 + 450);
    return () => {
      window.clearTimeout(enterEnd);
      window.clearTimeout(holdEnd);
      window.clearTimeout(exitEnd);
    };
  }, [active, durationSec, onDone, phase]);

  if (phase === "hidden") return null;

  const opacity = phase === "entering" ? 1 : phase === "held" ? 1 : 0;
  const vignetteOpacity =
    phase === "entering" || phase === "held" ? 0.65 : 0;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 28,
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.45s cubic-bezier(0.32, 0, 0.67, 0)",
      }}
    >
      {/* Radial vignette — darkens periphery, leaves center clear */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 0%, transparent 18%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
          opacity: vignetteOpacity,
          transition: "opacity 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
      {/* Upper aurora wisp — element-tinted gradient bleeds down from top */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "30%",
          background: `linear-gradient(180deg, ${accentHex}33 0%, ${accentHex}11 40%, transparent 100%)`,
          mixBlendMode: "screen",
        }}
      />
      {/* Lower aurora wisp — symmetric counterpart */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "30%",
          background: `linear-gradient(0deg, ${accentHex}33 0%, ${accentHex}11 40%, transparent 100%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
