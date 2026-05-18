"use client";

/**
 * VfxPane — Tweakpane bound to vfxScheduler().config.
 *
 * Operator can:
 *   - Tune per-family caps (max orbs, max particles, max waves, max shakes)
 *   - Tune per-family cooldowns (debounce repeat spawns)
 *   - Pick CSS vs Pixi renderer per element
 *   - Toggle per-family allowed phases
 *   - Set master intensity (multiplier)
 *   - Trigger test effects (orb / particle / wave) for visual diagnostic
 *   - Panic-flush all active effects
 *   - Monitor current active effect count + FPS
 */

import { useEffect, useRef } from "react";
import { DEFAULT_VFX_CONFIG, vfxScheduler } from "@/lib/vfx/scheduler";
import type { Element } from "@/lib/honeycomb/wuxing";
import { addFpsGraph, copyJsonToClipboard, loadPreset, makePane, registerEssentials, savePreset } from "./_pane-shared";

const PRESET_KEY = "vfx";
const ELEMENTS: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];

export function VfxPane() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const sched = vfxScheduler();

    const preset = loadPreset<typeof sched.config>(PRESET_KEY);
    if (preset) Object.assign(sched.config, preset);

    const pane = makePane({ container: containerRef.current, title: "VFX" });
    registerEssentials(pane);
    addFpsGraph(pane, "fps");

    const fGlobal = pane.addFolder({ title: "Global", expanded: true });
    fGlobal.addBinding(sched.config, "enabled", { label: "VFX enabled" });
    fGlobal.addBinding(sched.config, "intensity", { min: 0, max: 2, step: 0.05, label: "intensity ×" });
    fGlobal.addButton({ title: "🚨 panic flush all" }).on("click", () => sched.cancel());

    const fCaps = pane.addFolder({ title: "Family Caps", expanded: true });
    fCaps.addBinding(sched.config.maxConcurrent, "orb", { min: 0, max: 4, step: 1, label: "max orbs" });
    fCaps.addBinding(sched.config.maxConcurrent, "particle", { min: 0, max: 16, step: 1, label: "max particles" });
    fCaps.addBinding(sched.config.maxConcurrent, "wave", { min: 0, max: 4, step: 1, label: "max waves" });
    fCaps.addBinding(sched.config.maxConcurrent, "shake", { min: 0, max: 4, step: 1, label: "max shakes" });

    const fCooldown = pane.addFolder({ title: "Cooldowns (ms)", expanded: false });
    fCooldown.addBinding(sched.config.cooldownMs, "orb", { min: 0, max: 500, step: 10 });
    fCooldown.addBinding(sched.config.cooldownMs, "particle", { min: 0, max: 500, step: 10 });
    fCooldown.addBinding(sched.config.cooldownMs, "wave", { min: 0, max: 500, step: 10 });
    fCooldown.addBinding(sched.config.cooldownMs, "shake", { min: 0, max: 500, step: 10 });

    const fRender = pane.addFolder({ title: "Renderer per Element", expanded: false });
    for (const el of ELEMENTS) {
      fRender.addBinding(sched.config.particleRenderer, el, {
        label: `particle: ${el}`,
        options: { css: "css", pixi: "pixi" },
      });
    }

    const fMonitor = pane.addFolder({ title: "Active Effects", expanded: false });
    const monitor = { active: 0, orbs: 0, particles: 0, waves: 0, shakes: 0 };
    fMonitor.addBinding(monitor, "active", { readonly: true, view: "graph", min: 0, max: 16 });
    fMonitor.addBinding(monitor, "orbs", { readonly: true });
    fMonitor.addBinding(monitor, "particles", { readonly: true });
    fMonitor.addBinding(monitor, "waves", { readonly: true });
    fMonitor.addBinding(monitor, "shakes", { readonly: true });

    const updateMonitor = () => {
      const snap = sched.snapshot();
      monitor.active = snap.length;
      monitor.orbs = snap.filter((e) => e.family === "orb").length;
      monitor.particles = snap.filter((e) => e.family === "particle").length;
      monitor.waves = snap.filter((e) => e.family === "wave").length;
      monitor.shakes = snap.filter((e) => e.family === "shake").length;
    };
    const unsub = sched.subscribeAll(updateMonitor);

    const fTest = pane.addFolder({ title: "Test Triggers", expanded: false });
    for (const el of ELEMENTS) {
      fTest.addButton({ title: `▶ ${el} burst` }).on("click", () =>
        sched.request({
          family: "particle",
          element: el,
          currentPhase: "clashing",
          expectedDurationMs: 800,
        }),
      );
    }

    const fPersist = pane.addFolder({ title: "Preset", expanded: false });
    fPersist.addButton({ title: "save preset" }).on("click", () => savePreset(PRESET_KEY, sched.config));
    fPersist.addButton({ title: "copy json" }).on("click", () => copyJsonToClipboard(sched.config));
    fPersist.addButton({ title: "reset to default" }).on("click", () => {
      Object.assign(sched.config, JSON.parse(JSON.stringify(DEFAULT_VFX_CONFIG)));
      pane.refresh();
    });

    pane.on("change", () => savePreset(PRESET_KEY, sched.config));

    return () => {
      unsub();
      pane.dispose();
    };
  }, []);

  return <div ref={containerRef} />;
}
