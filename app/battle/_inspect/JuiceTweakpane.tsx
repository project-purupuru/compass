"use client";

/**
 * JuiceTweakpane — Tweakpane wired to the JuiceProfile schema.
 *
 * The hexagon contract layer made interactive: every knob in the
 * JUICE_SCHEMA + CSS_VAR_SCHEMA shows up as a Tweakpane binding.
 * Operator drags a slider → schema setter → live update via
 * juiceProfile.patch() OR document.documentElement.style.setProperty.
 *
 * No code changes needed when adding axes — extend JUICE_SCHEMA in
 * lib/juice/profile.ts and the binding appears here automatically.
 *
 * Persists current values to localStorage so a tuning session survives
 * reloads. "Reset to mode" buttons restore quiet/default/loud presets.
 *
 * NODE_ENV-gated by parent DevConsole. Never ships to production.
 *
 * Tweakpane v4 docs: https://tweakpane.github.io/docs/
 */

import { useEffect, useRef } from "react";
import { type FolderApi, Pane, type TpChangeEvent } from "tweakpane";
import { audioEngine } from "@/lib/audio/engine";
import {
  CSS_VAR_SCHEMA,
  JUICE_SCHEMA,
  type JuiceMode,
  type JuiceProfile,
  juiceProfile,
} from "@/lib/juice/profile";

const STORAGE_KEY = "puru-juice-overrides-v1";

interface PersistedState {
  readonly mode: JuiceMode;
  readonly profileOverrides: Partial<JuiceProfile>;
  readonly cssVars: Record<string, number>;
}

function readPersisted(): PersistedState {
  if (typeof window === "undefined") {
    return { mode: "default", profileOverrides: {}, cssVars: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: "default", profileOverrides: {}, cssVars: {} };
    return JSON.parse(raw) as PersistedState;
  } catch {
    return { mode: "default", profileOverrides: {}, cssVars: {} };
  }
}

function writePersisted(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function JuiceTweakpane() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<Pane | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (paneRef.current) return; // single-mount

    // ── Restore from localStorage and apply BEFORE building the pane ──
    const persisted = readPersisted();
    juiceProfile.setMode(persisted.mode);
    juiceProfile.patch(persisted.profileOverrides);
    for (const [cssVar, value] of Object.entries(persisted.cssVars)) {
      document.documentElement.style.setProperty(cssVar, String(value));
    }

    // ── Mutable bindings object (Tweakpane requires a single source object) ──
    // Strip readonly modifier off the spread profile values via shallow copy.
    const profileCopy: Record<string, unknown> = { ...juiceProfile.current };
    const cssVarValues: Record<string, number> = Object.fromEntries(
      CSS_VAR_SCHEMA.map((axis) => [
        axis.cssVar,
        persisted.cssVars[axis.cssVar] ?? axis.defaultValue,
      ]),
    );
    const params: Record<string, unknown> = {
      mode: persisted.mode as JuiceMode,
      ...profileCopy,
      ...cssVarValues,
    };

    // Pane extends FolderApi at runtime but the published TS type is
    // narrower; treat it as FolderApi for refresh/addFolder/addButton/etc.
    const pane = new Pane({
      container: containerRef.current,
      title: "Juice · Live Tuning",
    }) as unknown as FolderApi & { dispose: () => void; refresh: () => void };
    paneRef.current = pane as unknown as Pane;

    const persist = () => {
      // Mutable shape — JuiceProfile keys are `readonly` so we mutate
      // a Record then cast to Partial<JuiceProfile> on write.
      const profileOverrides: Record<string, unknown> = {};
      for (const axis of JUICE_SCHEMA) {
        profileOverrides[axis.key] = params[axis.key as string];
      }
      const cssVars: Record<string, number> = {};
      for (const axis of CSS_VAR_SCHEMA) {
        cssVars[axis.cssVar] = params[axis.cssVar] as number;
      }
      writePersisted({
        mode: params.mode as JuiceMode,
        profileOverrides: profileOverrides as Partial<JuiceProfile>,
        cssVars,
      });
    };

    // ── Mode preset selector ──
    pane
      .addBinding(params, "mode", {
        label: "preset",
        options: { quiet: "quiet", default: "default", loud: "loud" },
      })
      .on("change", (ev: TpChangeEvent<unknown>) => {
        const newMode = ev.value as JuiceMode;
        juiceProfile.setMode(newMode);
        // Push the new defaults BACK into params so the sliders refresh
        for (const axis of JUICE_SCHEMA) {
          params[axis.key as string] = juiceProfile.current[axis.key];
        }
        pane.refresh();
        persist();
      });

    pane.addBlade({ view: "separator" });

    // ── Group axes by category ──
    type Group = (typeof JUICE_SCHEMA)[number]["group"];
    const groupTitles: Record<Group, string> = {
      "card-deal": "Card deal",
      hover: "Hover & select",
      "lock-in": "Lock-in commitment",
      clash: "Clash impact",
      discovery: "Combo discovery",
    };

    const groups = ["card-deal", "hover", "lock-in", "clash", "discovery"] as const;
    for (const group of groups) {
      const folder = pane.addFolder({ title: groupTitles[group], expanded: group === "card-deal" });
      const axes = JUICE_SCHEMA.filter((a) => a.group === group);
      for (const axis of axes) {
        folder
          .addBinding(params, axis.key as string, {
            label: `${axis.label} (${axis.unit})`,
            min: axis.min,
            max: axis.max,
            step: axis.step,
          })
          .on("change", (ev: TpChangeEvent<unknown>) => {
            juiceProfile.patch({ [axis.key]: ev.value as number } as Partial<JuiceProfile>);
            persist();
          });
      }
    }

    pane.addBlade({ view: "separator" });

    // ── CSS variable axes (camera / breathing) ──
    const cssGroups = ["camera", "breathing"] as const;
    const cssGroupTitles: Record<(typeof cssGroups)[number], string> = {
      camera: "Camera (CSS vars)",
      breathing: "Breathing (CSS vars)",
    };
    for (const group of cssGroups) {
      const folder = pane.addFolder({ title: cssGroupTitles[group], expanded: false });
      const axes = CSS_VAR_SCHEMA.filter((a) => a.group === group);
      for (const axis of axes) {
        folder
          .addBinding(params, axis.cssVar, {
            label: `${axis.label} (${axis.unit})`,
            min: axis.min,
            max: axis.max,
            step: axis.step,
          })
          .on("change", (ev: TpChangeEvent<unknown>) => {
            document.documentElement.style.setProperty(
              axis.cssVar,
              String(ev.value),
            );
            persist();
          });
        // Apply the persisted/default value immediately so the page reflects it.
        document.documentElement.style.setProperty(
          axis.cssVar,
          String(params[axis.cssVar]),
        );
      }
    }

    pane.addBlade({ view: "separator" });

    // ── Audio (engine routes through localStorage; we just bind UI) ──
    const audio = audioEngine();
    const audioParams = {
      enabled: audio.isEnabled(),
      master: audio.getVolumes().master,
      sfx: audio.getVolumes().sfx,
      music: audio.getVolumes().music,
    };
    const audioFolder = pane.addFolder({ title: "Audio", expanded: true });
    audioFolder
      .addBinding(audioParams, "enabled", { label: "sound on" })
      .on("change", (ev: TpChangeEvent<unknown>) => audio.setEnabled(Boolean(ev.value)));
    audioFolder
      .addBinding(audioParams, "master", { label: "master vol", min: 0, max: 1, step: 0.01 })
      .on("change", (ev: TpChangeEvent<unknown>) => audio.setMasterVolume(Number(ev.value)));
    audioFolder
      .addBinding(audioParams, "sfx", { label: "SFX vol", min: 0, max: 1, step: 0.01 })
      .on("change", (ev: TpChangeEvent<unknown>) => audio.setSfxVolume(Number(ev.value)));
    audioFolder
      .addBinding(audioParams, "music", { label: "music vol", min: 0, max: 1, step: 0.01 })
      .on("change", (ev: TpChangeEvent<unknown>) => audio.setMusicVolume(Number(ev.value)));
    // Audition buttons — useful while tuning the procedural fallbacks.
    audioFolder.addButton({ title: "▶ ui.tap" }).on("click", () => audio.play("ui.tap"));
    audioFolder.addButton({ title: "▶ match.lock-in" }).on("click", () => audio.play("match.lock-in"));
    audioFolder.addButton({ title: "▶ discovery.combo" }).on("click", () => audio.play("discovery.combo"));
    audioFolder.addButton({ title: "▶ match.win" }).on("click", () => audio.play("match.win"));
    audioFolder.addButton({ title: "▶ match.lose" }).on("click", () => audio.play("match.lose"));

    pane.addBlade({ view: "separator" });

    // ── Reset button ──
    pane.addButton({ title: "↺ Reset to preset" }).on("click", () => {
      juiceProfile.setMode(params.mode as JuiceMode);
      for (const axis of JUICE_SCHEMA) {
        params[axis.key as string] = juiceProfile.current[axis.key];
      }
      for (const axis of CSS_VAR_SCHEMA) {
        params[axis.cssVar] = axis.defaultValue;
        document.documentElement.style.setProperty(
          axis.cssVar,
          String(axis.defaultValue),
        );
      }
      pane.refresh();
      persist();
    });

    return () => {
      pane.dispose();
      paneRef.current = null;
    };
  }, []);

  return (
    <section className="dev-section dev-tweakpane">
      <h3 className="dev-h3">live tuning · juice</h3>
      <p className="dev-h-sub">
        Drag any knob to live-tune the game's feel. Persists across reload.
        The schema lives in <code>lib/juice/profile.ts</code> — adding a knob
        there surfaces it here automatically.
      </p>
      <div ref={containerRef} className="dev-tweakpane-host" />
    </section>
  );
}
