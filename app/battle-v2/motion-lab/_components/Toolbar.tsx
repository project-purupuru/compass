/**
 * Toolbar — global motion variant selector + global state broadcaster.
 *
 * Top of the lab. Lets you A/B/C variants across ALL stations at once, and
 * push a global state to make every puppet do the same thing simultaneously
 * (useful for comparing how a "crumple" reads across all elements).
 */

"use client";

import {
  MOTION_VARIANTS,
  MOTION_VARIANT_ORDER,
  type MotionVariant,
  type PuppetState,
} from "../../_components/puppet/PaperPuppetMotion";

interface ToolbarProps {
  readonly variant: MotionVariant;
  readonly onVariantChange: (next: MotionVariant) => void;
  readonly globalState: PuppetState | null;
  readonly onGlobalStateChange: (next: PuppetState | null) => void;
}

const GLOBAL_BROADCAST_STATES: readonly PuppetState[] = [
  "walk",
  "action",
  "summon",
  "crumple",
];

export function Toolbar({
  variant,
  onVariantChange,
  globalState,
  onGlobalStateChange,
}: ToolbarProps) {
  const activeConfig = MOTION_VARIANTS[variant];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "20px 24px",
        background: "var(--puru-cloud-bright)",
        border: "1px solid var(--puru-surface-border)",
        borderRadius: "var(--radius-md, 12px)",
        boxShadow: "var(--shadow-tile)",
      }}
    >
      {/* Variant picker — pill row */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-puru-mono)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--puru-ink-soft)",
          }}
        >
          motion variant
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {MOTION_VARIANT_ORDER.map((v) => {
            const active = v === variant;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onVariantChange(v)}
                style={{
                  padding: "8px 14px",
                  fontFamily: "var(--font-puru-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: active ? "var(--puru-honey-base)" : "var(--puru-cloud-base)",
                  color: active ? "oklch(0.15 0.04 80)" : "var(--puru-ink-base)",
                  border: `1px solid ${active ? "var(--puru-honey-base)" : "var(--puru-surface-border)"}`,
                  borderRadius: "var(--radius-sm, 6px)",
                  cursor: "pointer",
                  transition: "all 200ms cubic-bezier(0,0,0.2,1)",
                }}
              >
                {MOTION_VARIANTS[v].displayName}
              </button>
            );
          })}
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-puru-body)",
          fontSize: "13px",
          lineHeight: 1.5,
          color: "var(--puru-ink-base)",
          maxWidth: 720,
        }}
      >
        <span style={{ color: "var(--puru-ink-rich)", fontWeight: 600 }}>
          {activeConfig.displayName}.
        </span>{" "}
        {activeConfig.description}
      </p>

      {/* Vocab params readout (dev) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 6,
          padding: "10px 12px",
          background: "var(--puru-cloud-base)",
          borderRadius: "var(--radius-sm, 6px)",
          fontFamily: "var(--font-puru-mono)",
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: "var(--puru-ink-soft)",
        }}
      >
        <span>walk · {activeConfig.walkFps}fps</span>
        <span>bounce · {activeConfig.idleBouncePx}px / {activeConfig.idleBouncePeriod}s</span>
        <span>bend · {activeConfig.bendEnabled ? `${activeConfig.bendDeg}°` : "off"}</span>
        <span>shadow · {activeConfig.shadowEnabled ? "on" : "off"}</span>
        <span>crumple · {activeConfig.crumpleDuration}s</span>
        <span>action · {activeConfig.actionDuration}s</span>
        <span>summon · {activeConfig.summonPattern} / {activeConfig.summonDuration}s</span>
        <span>sticker · {activeConfig.stickerLayerEnabled ? "on" : "off"}</span>
      </div>

      {/* Global state broadcaster */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-puru-mono)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--puru-ink-soft)",
          }}
        >
          broadcast to all
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onGlobalStateChange(null)}
            style={{
              padding: "6px 12px",
              fontFamily: "var(--font-puru-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              background:
                globalState === null ? "var(--puru-cloud-deep)" : "var(--puru-cloud-base)",
              color: "var(--puru-ink-base)",
              border: "1px solid var(--puru-surface-border)",
              borderRadius: "var(--radius-sm, 6px)",
              cursor: "pointer",
            }}
          >
            release · local
          </button>
          {GLOBAL_BROADCAST_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onGlobalStateChange(s)}
              style={{
                padding: "6px 12px",
                fontFamily: "var(--font-puru-mono)",
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                background:
                  globalState === s ? "var(--puru-honey-base)" : "var(--puru-cloud-base)",
                color: globalState === s ? "oklch(0.15 0.04 80)" : "var(--puru-ink-base)",
                border: "1px solid var(--puru-surface-border)",
                borderRadius: "var(--radius-sm, 6px)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
