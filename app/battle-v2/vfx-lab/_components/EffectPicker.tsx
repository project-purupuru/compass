/**
 * EffectPicker — left rail · lists every effect in VFX_REGISTRY.
 *
 * Click switches the active effect. The selected entry shows the honey-base
 * active state; idle entries sit in cloud-base. The lab is sandbox-mode this
 * session — the picker is the only navigation; no nested sub-effects yet.
 */

"use client";

import type { AnyVfxDefinition } from "../../_components/vfx/VfxRegistry";

interface EffectPickerProps {
  readonly entries: readonly AnyVfxDefinition[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}

export function EffectPicker({
  entries,
  activeId,
  onSelect,
}: EffectPickerProps) {
  return (
    <aside
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "16px 12px",
        background: "var(--puru-cloud-deep, #1a1410)",
        borderRight: "1px solid var(--puru-surface-border)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-puru-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--puru-ink-soft, #c2b89c)",
          padding: "0 4px 8px",
          borderBottom: "1px solid var(--puru-surface-border)",
        }}
      >
        effects
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {entries.map((def) => {
          const active = def.id === activeId;
          return (
            <li key={def.id}>
              <button
                type="button"
                onClick={() => onSelect(def.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  background: active
                    ? "var(--puru-honey-base, #e1ad3d)"
                    : "var(--puru-cloud-base, #25201a)",
                  color: active
                    ? "oklch(0.15 0.04 80)"
                    : "var(--puru-ink-base, #d8cdae)",
                  border: `1px solid ${
                    active
                      ? "var(--puru-honey-base, #e1ad3d)"
                      : "var(--puru-surface-border)"
                  }`,
                  borderRadius: "var(--radius-sm, 6px)",
                  cursor: "pointer",
                  fontFamily: "var(--font-puru-body)",
                  transition: "background 80ms ease",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-puru-mono)",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  {def.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: active ? 0.8 : 0.65,
                  }}
                >
                  {def.sub}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
