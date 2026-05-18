/**
 * HitText — renders a typography tier animating through its entry/hold/exit
 * cycle. The text is the climax; the typography IS the game-juice.
 *
 * Operator framing 2026-05-17: "refining the typography and the animation
 * of the typography rather than the actual text itself" is the work. This
 * component is the surface where that refinement happens. Tune the tokens
 * in `lib/choreography/typography.ts` and feel them live.
 *
 * Render model:
 *   - Screen-space (position: fixed, viewport-anchored)
 *   - Layered above the world canvas (zIndex matches CardLab.tsx Html range)
 *   - Per-frame scale + opacity driven by `sampleTypoAnim` from the tier
 *   - Style spec (font/stroke/shadow/gradient) read from TYPOGRAPHY_TOKENS
 *   - When the animation completes, `onSettle` fires so the parent can
 *     dismount or reset
 *
 * Tier examples:
 *   base-hit       → "HIT" (italic serif, white core, heavy stroke)
 *   combo-2/3/4    → "2 CHAIN" / "3 CHAIN" / "4 CHAIN" (gold metallic)
 *   ultimate-chain → "FULL CYCLE" (brush-stroke, ⅓ screen takeover)
 *   tide-banner    → "THE TIDE FAVORED WOOD" (largest, slowest, biggest hold)
 */

"use client";

import { useEffect, useRef, useState } from "react";

import {
  sampleTypoAnim,
  TYPOGRAPHY_TOKENS,
  type TypoTier,
} from "@/lib/choreography/typography";

interface HitTextProps {
  readonly tier: TypoTier;
  readonly text: string;
  readonly onSettle?: () => void;
  /** Vertical position 0..1 (0=top, 1=bottom). Default 0.4 (above center). */
  readonly anchorY?: number;
}

export function HitText({ tier, text, onSettle, anchorY = 0.4 }: HitTextProps) {
  const [sample, setSample] = useState(() => sampleTypoAnim(tier, 0));
  const startRef = useRef<number | null>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    settledRef.current = false;
    startRef.current = performance.now() / 1000;
    let raf = 0;
    const tick = () => {
      if (startRef.current === null) return;
      const elapsed = performance.now() / 1000 - startRef.current;
      const s = sampleTypoAnim(tier, elapsed);
      setSample(s);
      if (s.phase === "done") {
        if (!settledRef.current) {
          settledRef.current = true;
          onSettle?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tier, text, onSettle]);

  if (sample.opacity <= 0.01) return null;

  const token = TYPOGRAPHY_TOKENS[tier];
  const { style } = token;

  // Composed text-shadow with the heavy stroke + drop shadow per
  // Gemini's directive #5: heavy black stroke on ALL screen-space text.
  // The stroke is approximated via multiple drop-shadows in cardinal
  // directions; for production, a -webkit-text-stroke or SVG might be
  // crisper. CSS approximation reads adequately at the scales used.
  const strokeRadius = style.strokeWidthPx;
  const strokeShadows = [
    `${strokeRadius}px 0 0 ${style.strokeColor}`,
    `-${strokeRadius}px 0 0 ${style.strokeColor}`,
    `0 ${strokeRadius}px 0 ${style.strokeColor}`,
    `0 -${strokeRadius}px 0 ${style.strokeColor}`,
    `${strokeRadius}px ${strokeRadius}px 0 ${style.strokeColor}`,
    `-${strokeRadius}px ${strokeRadius}px 0 ${style.strokeColor}`,
    `${strokeRadius}px -${strokeRadius}px 0 ${style.strokeColor}`,
    `-${strokeRadius}px -${strokeRadius}px 0 ${style.strokeColor}`,
    // Final drop-shadow with blur for the theme glow
    `${style.shadowOffsetPx[0]}px ${style.shadowOffsetPx[1]}px ${style.shadowBlurPx}px ${style.shadowColor}`,
  ].join(", ");

  // Background style: solid color OR gradient for combo/ultimate tiers.
  const background = style.gradient
    ? `linear-gradient(${style.gradient.angle}deg, ${style.gradient.from}, ${style.gradient.to})`
    : style.coreColor;
  // Gradients use background-clip: text to fill the glyph shape.
  const fillStyle: React.CSSProperties = style.gradient
    ? {
        background,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : { color: style.coreColor };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: `${anchorY * 100}%`,
        left: "50%",
        transform: `translate(-50%, -50%) scale(${sample.scale})`,
        transformOrigin: "50% 50%",
        opacity: sample.opacity,
        pointerEvents: "none",
        zIndex: 30,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          ...fillStyle,
          fontSize: `${style.fontSizePx}px`,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontStyle: style.italic ? "italic" : "normal",
          letterSpacing: `${style.letterSpacingEm}em`,
          textShadow: strokeShadows,
          lineHeight: 1.0,
          // Gradient fills can't use textShadow for the stroke (it draws
          // through the gradient). Fallback: use -webkit-text-stroke for
          // the outline + drop-shadow filter for the glow. Hybrid approach.
          ...(style.gradient
            ? {
                WebkitTextStroke: `${style.strokeWidthPx}px ${style.strokeColor}`,
                filter: `drop-shadow(${style.shadowOffsetPx[0]}px ${style.shadowOffsetPx[1]}px ${style.shadowBlurPx}px ${style.shadowColor})`,
                textShadow: "none",
              }
            : {}),
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ── Typography-preview controller ─────────────────────────────────────────

/**
 * TypographyPreview — controller for the card-lab. Renders a button strip
 * + the active text moment. Clicking a tier button fires that tier's
 * animation; the text auto-dismisses on settle.
 *
 * The "demo strings" per tier are placeholders; the actual game text
 * comes from the runtime context (combo count, element, etc.). Lab
 * shows representative strings so the operator can feel the type.
 */

const DEMO_STRINGS: Record<TypoTier, string> = {
  "base-hit": "HIT",
  "combo-2": "2 CHAIN",
  "combo-3": "3 CHAIN",
  "combo-4": "4 CHAIN",
  "ultimate-chain": "FULL CYCLE",
  "tide-banner": "THE TIDE FAVORED WOOD",
};

const TIER_KEYS: { tier: TypoTier; key: string; label: string }[] = [
  { tier: "base-hit",       key: "6", label: "HIT" },
  { tier: "combo-2",        key: "7", label: "2-chain" },
  { tier: "combo-3",        key: "8", label: "3-chain" },
  { tier: "combo-4",        key: "9", label: "4-chain" },
  { tier: "ultimate-chain", key: "0", label: "ultimate" },
  { tier: "tide-banner",    key: "-", label: "tide" },
];

interface TypographyPreviewProps {
  /** When true, renders the button strip + listens to keybinds 6-0 + -. */
  readonly enabled?: boolean;
}

export function TypographyPreview({ enabled = true }: TypographyPreviewProps) {
  const [active, setActive] = useState<{ tier: TypoTier; nonce: number } | null>(
    null,
  );

  const fire = (tier: TypoTier) => {
    setActive({ tier, nonce: Date.now() });
  };

  // Keybind 6-0 + - to fire each tier
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      const match = TIER_KEYS.find((t) => t.key === e.key);
      if (match) fire(match.tier);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  return (
    <>
      {active && (
        <HitText
          key={active.nonce}
          tier={active.tier}
          text={DEMO_STRINGS[active.tier]}
          onSettle={() => setActive(null)}
          anchorY={active.tier === "tide-banner" ? 0.5 : 0.4}
        />
      )}

      {enabled && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            // Mid-left rail — clear of the vfx-lab left pane (220px) and
            // clear of the right knob pane (~320px). Sits along the inner
            // edge of the preview area so it doesn't collide with the
            // bottom-left keybind hints or the right tweakpane.
            top: 96,
            left: 244,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "rgba(20,14,8,0.75)",
            border: "1px solid rgba(200,160,100,0.25)",
            borderRadius: 6,
            padding: "10px 12px",
            zIndex: 11,
            fontFamily: "var(--font-puru-mono, monospace)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(220,200,160,0.85)",
            pointerEvents: "auto",
            minWidth: 150,
          }}
        >
          <div
            style={{
              opacity: 0.7,
              fontSize: 9,
              letterSpacing: "0.2em",
              marginBottom: 4,
            }}
          >
            type tiers
          </div>
          {TIER_KEYS.map((t) => (
            <button
              key={t.tier}
              type="button"
              onClick={() => fire(t.tier)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "4px 6px",
                background: "transparent",
                border: "1px solid rgba(200,160,100,0.15)",
                color: "rgba(220,200,160,0.85)",
                fontFamily: "inherit",
                fontSize: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                cursor: "pointer",
                borderRadius: 3,
              }}
            >
              <span>{t.label}</span>
              <span style={{ opacity: 0.55 }}>[{t.key}]</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
