/**
 * KnobPane — vanilla tweakpane host for the active VFX effect.
 *
 * Session-14 right rail. Operator-locked decisions reflected here:
 *   - Vanilla tweakpane in useEffect (no React wrapper).
 *   - Knobs are HAND-MAPPED via each effect's `registerKnobs` (NO schema
 *     introspection — see VfxRegistry.ts header).
 *   - Preset I/O uses Pane.exportState()/importState() (v4 API). Export
 *     downloads JSON for drop into grimoires/loa/specs/vfx-presets/.
 *
 * Lifecycle: when `effectDef.id` changes the pane is disposed and re-
 * created against the new effect's config + knobs. Any change to a knob
 * fires the `onChange` callback so the parent can re-render the preview.
 */

"use client";

import { useEffect, useRef } from "react";

import { Pane } from "tweakpane";

import type { AnyVfxDefinition } from "../../_components/vfx/VfxRegistry";

/**
 * Structural surface of the Pane methods we use. Tweakpane v4 inherits these
 * from FolderApi (addFolder, addButton, on, exportState, importState) but
 * `@tweakpane/core` isn't installed as a separate package so TypeScript only
 * sees the top-level Pane shape. Runtime is correct — this cast bridges the
 * type gap without pulling in core types.
 */
interface PaneRuntime {
  addFolder(opts: { title: string; expanded?: boolean }): PaneRuntime;
  addButton(opts: { title: string }): {
    on(ev: "click", fn: () => void): unknown;
  };
  exportState(): Record<string, unknown>;
  importState(state: Record<string, unknown>): void;
  on(ev: "change", fn: () => void): unknown;
  dispose(): void;
}

interface KnobPaneProps {
  readonly effectDef: AnyVfxDefinition;
  /** Mutable config object — tweakpane writes back to its keys in place. */
  readonly config: Record<string, unknown>;
  /** Bumped on every binding change so the parent re-renders. */
  readonly onChange: () => void;
  /** Trigger button — fires the effect once. */
  readonly onTrigger: () => void;
}

export function KnobPane({
  effectDef,
  config,
  onChange,
  onTrigger,
}: KnobPaneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<Pane | null>(null);
  // Keep refs to the latest callbacks so the pane's bound listeners see them
  // without forcing a pane rebuild on every parent re-render.
  const onChangeRef = useRef(onChange);
  const onTriggerRef = useRef(onTrigger);
  onChangeRef.current = onChange;
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const paneInstance = new Pane({ container, title: effectDef.label });
    paneRef.current = paneInstance;
    const pane = paneInstance as unknown as PaneRuntime;

    // Ops folder up top — trigger + preset I/O.
    const ops = pane.addFolder({ title: "ops", expanded: true });
    ops.addButton({ title: "trigger ▶" }).on("click", () => {
      onTriggerRef.current();
    });
    ops.addButton({ title: "copy preset (json)" }).on("click", async () => {
      try {
        const state = pane.exportState();
        await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
      } catch (err) {
        console.warn("[vfx-lab] copy preset failed", err);
      }
    });
    ops.addButton({ title: "download preset" }).on("click", () => {
      const state = pane.exportState();
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${effectDef.id}.preset.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
    ops.addButton({ title: "import preset…" }).on("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const state = JSON.parse(text) as Record<string, unknown>;
          pane.importState(state);
          onChangeRef.current();
        } catch (err) {
          console.warn("[vfx-lab] import preset failed", err);
        }
      };
      input.click();
    });

    // Effect-specific knobs.
    effectDef.registerKnobs(
      pane as unknown as Parameters<typeof effectDef.registerKnobs>[0],
      config as never,
    );

    pane.on("change", () => onChangeRef.current());

    return () => {
      paneInstance.dispose();
      paneRef.current = null;
    };
    // Rebuild on effect change. `config` is mutated in place by the same
    // pane, so we deliberately don't re-create on config identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectDef.id]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "12px 12px 24px",
        background: "var(--puru-cloud-deep, #1a1410)",
        borderLeft: "1px solid var(--puru-surface-border)",
      }}
    >
      <div
        ref={mountRef}
        style={{
          // tweakpane theme: bend toward the lab register via CSS vars.
          ["--tp-base-background-color" as string]: "rgba(0,0,0,0)",
          ["--tp-label-foreground-color" as string]:
            "var(--puru-ink-soft, #c2b89c)",
          ["--tp-button-background-color" as string]:
            "var(--puru-honey-base, #e1ad3d)",
          ["--tp-button-foreground-color" as string]: "oklch(0.15 0.04 80)",
          ["--tp-container-background-color" as string]:
            "var(--puru-cloud-base, #25201a)",
          ["--tp-input-background-color" as string]:
            "var(--puru-cloud-bright, #2f291f)",
          ["--tp-input-foreground-color" as string]:
            "var(--puru-ink-rich, #f3e9d2)",
        }}
      />
    </div>
  );
}
