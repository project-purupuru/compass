"use client";

/**
 * CameraPane — Tweakpane bound to cameraEngine().config.
 *
 * Surface every knob of the parallax/shake engine + a live FpsGraph + a
 * monitor slot for current camera state. Operator can creatively direct
 * the feel of the camera at runtime; values persist to localStorage.
 *
 * Doctrine — the panel does NOT own state. It binds to engine.config
 * and the engine reads those values on every RAF tick. Live edits =
 * instant feedback.
 */

import { useEffect, useRef } from "react";
import { cameraEngine, DEFAULT_CAMERA_CONFIG } from "@/lib/camera/parallax-engine";
import { addFpsGraph, copyJsonToClipboard, loadPreset, makePane, registerEssentials, savePreset } from "./_pane-shared";

const PRESET_KEY = "camera";

export function CameraPane() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = cameraEngine();

    // Hydrate from preset before binding so initial values match
    const preset = loadPreset<typeof engine.config>(PRESET_KEY);
    if (preset) Object.assign(engine.config, preset);

    let pane: ReturnType<typeof makePane>;
    try {
      pane = makePane({ container: containerRef.current, title: "Camera" });
      registerEssentials(pane);
      addFpsGraph(pane, "fps");
    } catch (err) {
      console.error("[CameraPane] init failed:", err);
      return;
    }

    const fSmoothing = pane.addFolder({ title: "Smoothing", expanded: true });
    fSmoothing.addBinding(engine.config, "smoothing", { min: 0.05, max: 0.30, step: 0.005, label: "lerp" });
    fSmoothing.addBinding(engine.config, "maxTravelPx", { min: 0, max: 24, step: 0.5, label: "max travel px" });
    fSmoothing.addBinding(engine.config, "arenaDepth", { min: 0, max: 1, step: 0.05, label: "arena depth" });
    fSmoothing.addBinding(engine.config, "cardDepth", { min: 0, max: 1, step: 0.02, label: "card depth" });

    const fDrift = pane.addFolder({ title: "Idle Drift", expanded: false });
    fDrift.addBinding(engine.config, "idleDriftEnabled", { label: "enabled" });
    fDrift.addBinding(engine.config, "idleDriftAmp", { min: 0, max: 1, step: 0.02, label: "amplitude" });
    fDrift.addBinding(engine.config, "idleDriftPeriodSec", { min: 2, max: 30, step: 0.5, label: "period (s)" });
    fDrift.addBinding(engine.config, "idleDriftDelayMs", { min: 0, max: 5000, step: 100, label: "delay (ms)" });

    const fImpulse = pane.addFolder({ title: "Impulse + Shake", expanded: false });
    fImpulse.addBinding(engine.config, "punchDecay", { min: 0.05, max: 0.4, step: 0.01, label: "punch decay" });
    fImpulse.addBinding(engine.config, "shakeDecay", { min: 0.05, max: 0.4, step: 0.01, label: "shake decay" });
    fImpulse.addBinding(engine.config, "shakeJitterPx", { min: 1, max: 24, step: 0.5, label: "shake px" });

    const fTest = pane.addFolder({ title: "Test", expanded: true });
    fTest.addButton({ title: "punch ↑" }).on("click", () => engine.punch(0, -0.4));
    fTest.addButton({ title: "punch →" }).on("click", () => engine.punch(0.4, 0));
    fTest.addButton({ title: "shake light" }).on("click", () => engine.shake(0.3));
    fTest.addButton({ title: "shake medium" }).on("click", () => engine.shake(0.6));
    fTest.addButton({ title: "shake heavy" }).on("click", () => engine.shake(1.0));
    fTest.addButton({ title: "hitstop 150ms" }).on("click", () => engine.freezeFrames(150));
    fTest.addButton({ title: "hitstop 280ms (final)" }).on("click", () => engine.freezeFrames(280));

    const fMonitor = pane.addFolder({ title: "Monitor", expanded: false });
    // Read-only mirror of engine state (refreshed each frame via subscription)
    const monitor = {
      currentX: 0,
      currentY: 0,
      trauma: 0,
      hitstop: false,
    };
    fMonitor.addBinding(monitor, "currentX", { readonly: true, view: "graph", min: -1, max: 1 });
    fMonitor.addBinding(monitor, "currentY", { readonly: true, view: "graph", min: -1, max: 1 });
    fMonitor.addBinding(monitor, "trauma", { readonly: true, view: "graph", min: 0, max: 1 });
    fMonitor.addBinding(monitor, "hitstop", { readonly: true });

    // FAGAN M6: monitor needs per-frame updates → use subscribeFrame.
    const unsub = engine.subscribeFrame(() => {
      const s = engine.readState();
      monitor.currentX = s.currentX;
      monitor.currentY = s.currentY;
      monitor.trauma = s.trauma;
      monitor.hitstop = engine.isHitstopActive();
    });

    const fPersist = pane.addFolder({ title: "Preset", expanded: false });
    fPersist.addButton({ title: "save preset" }).on("click", () => savePreset(PRESET_KEY, engine.config));
    fPersist.addButton({ title: "copy json" }).on("click", () => copyJsonToClipboard(engine.config));
    fPersist.addButton({ title: "reset to default" }).on("click", () => {
      Object.assign(engine.config, DEFAULT_CAMERA_CONFIG);
      pane.refresh();
    });

    // Persist on every change
    pane.on("change", () => savePreset(PRESET_KEY, engine.config));

    return () => {
      unsub();
      pane.dispose();
    };
  }, []);

  return <div ref={containerRef} />;
}
