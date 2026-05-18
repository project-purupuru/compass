/**
 * PostPane — global post-process tweakpane, persistent across effect changes.
 *
 * Per dig-session-2026-05-16-T4 (Scheimpflug). The Poimandres TiltShift
 * recipe: ignore Z-depth, use a tight screen-space focal band, accept the
 * "tall object problem" as the diorama aesthetic. Knobs let the operator
 * A/B the tilt live.
 *
 * Mounts a small standalone Pane in the canvas overlay (top-right corner).
 * Holds its own state internally and surfaces changes via callback.
 */

"use client";

import { useEffect, useRef } from "react";

import { Pane } from "tweakpane";

import type { PostConfig } from "./postConfig";

interface PaneRuntime {
  addFolder(opts: { title: string; expanded?: boolean }): PaneRuntime;
  addBinding(
    obj: Record<string, unknown>,
    key: string,
    opts?: Record<string, unknown>,
  ): unknown;
  on(ev: "change", fn: () => void): unknown;
  dispose(): void;
}

interface PostPaneProps {
  /** Mutable config — tweakpane writes back in place. */
  readonly config: PostConfig;
  /** Bumped on any binding change. */
  readonly onChange: () => void;
}

export function PostPane({ config, onChange }: PostPaneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const paneInstance = new Pane({ container, title: "post · scheimpflug" });
    const pane = paneInstance as unknown as PaneRuntime;

    pane.addBinding(config as unknown as Record<string, unknown>, "enabled", {
      label: "enabled",
    });

    const tilt = pane.addFolder({ title: "tilt-shift", expanded: true });
    tilt.addBinding(config as unknown as Record<string, unknown>, "blur", {
      label: "blur",
      min: 0,
      max: 2,
      step: 0.01,
    });
    tilt.addBinding(config as unknown as Record<string, unknown>, "taper", {
      label: "taper",
      min: 0,
      max: 2,
      step: 0.01,
    });
    tilt.addBinding(config as unknown as Record<string, unknown>, "startY", {
      label: "band top",
      min: 0,
      max: 1,
      step: 0.005,
    });
    tilt.addBinding(config as unknown as Record<string, unknown>, "endY", {
      label: "band bot",
      min: 0,
      max: 1,
      step: 0.005,
    });
    tilt.addBinding(config as unknown as Record<string, unknown>, "tilt", {
      label: "tilt deg",
      min: -20,
      max: 20,
      step: 0.5,
    });
    tilt.addBinding(config as unknown as Record<string, unknown>, "samples", {
      label: "samples",
      min: 4,
      max: 24,
      step: 1,
    });

    pane.on("change", () => onChangeRef.current());

    return () => {
      paneInstance.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 240,
        zIndex: 8,
        pointerEvents: "auto",
      }}
    >
      <div
        ref={mountRef}
        style={{
          ["--tp-base-background-color" as string]:
            "var(--puru-cloud-deep, #1a1410)",
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
