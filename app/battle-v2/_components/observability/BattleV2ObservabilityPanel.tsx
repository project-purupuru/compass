"use client";

import { useEffect, useMemo, useState } from "react";

import type { BattleV2ObservabilitySnapshot } from "./types";

interface BattleV2ObservabilityPanelProps {
  readonly enabled: boolean;
  readonly locked: boolean;
  readonly snapshot: BattleV2ObservabilitySnapshot | null;
  readonly onToggleEnabled: () => void;
  readonly onToggleLocked: () => void;
}

function fmt(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(digits);
}

function riskTone(snapshot: BattleV2ObservabilitySnapshot | null): string {
  if (!snapshot) return "idle";
  if (snapshot.frame.fps < 45 || snapshot.pointer.zFightCandidates.length > 0) {
    return "bad";
  }
  if (snapshot.frame.frameMsP95 > 20 || snapshot.pointer.sortThrashCandidates.length > 0) {
    return "warn";
  }
  return "good";
}

interface RafStats {
  readonly fps: number;
  readonly p95: number;
  readonly samples: number;
}

interface LongTaskRecord {
  readonly at: number;
  readonly duration: number;
}

const LONG_TASK_RECENT_WINDOW_MS = 5_000;

export function BattleV2ObservabilityPanel({
  enabled,
  locked,
  snapshot,
  onToggleEnabled,
  onToggleLocked,
}: BattleV2ObservabilityPanelProps) {
  const [longTasks, setLongTasks] = useState<readonly LongTaskRecord[]>([]);
  const [rafStats, setRafStats] = useState<RafStats>({
    fps: 0,
    p95: 0,
    samples: 0,
  });

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    try {
      const observer = new PerformanceObserver((list) => {
        const records = list.getEntries().map((entry) => ({
          at: entry.startTime + entry.duration,
          duration: entry.duration,
        }));
        setLongTasks((current) => [...current, ...records].slice(-24));
      });
      observer.observe({ type: "longtask", buffered: true });
      return () => observer.disconnect();
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = performance.now();
    let lastPublish = last;
    const samples: number[] = [];
    const tick = (now: number) => {
      samples.push(now - last);
      if (samples.length > 180) samples.shift();
      last = now;
      if (now - lastPublish >= 500) {
        const avg =
          samples.reduce((sum, ms) => sum + ms, 0) / Math.max(1, samples.length);
        const sorted = [...samples].sort((a, b) => a - b);
        const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
        setRafStats({
          fps: avg > 0 ? 1000 / avg : 0,
          p95,
          samples: samples.length,
        });
        lastPublish = now;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [enabled]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "F10") {
        event.preventDefault();
        onToggleEnabled();
      }
      if (!enabled) return;
      if (event.key.toLowerCase() === "l") {
        onToggleLocked();
      }
      if (event.key === "F12") {
        console.groupCollapsed("[battle-v2] observability snapshot");
        console.log(snapshot);
        if (snapshot?.pointer.zFightCandidates.length) {
          console.table(snapshot.pointer.zFightCandidates);
        }
        if (snapshot?.pointer.sortThrashCandidates.length) {
          console.table(snapshot.pointer.sortThrashCandidates);
        }
        console.groupEnd();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onToggleEnabled, onToggleLocked, snapshot]);

  const now = snapshot?.updatedAt ?? performance.now();
  const recentLongTasks = longTasks.filter(
    (task) => now - task.at <= LONG_TASK_RECENT_WINDOW_MS,
  );
  const latestLongTask = recentLongTasks.at(-1)?.duration ?? 0;
  const tone = riskTone(snapshot);
  const title = useMemo(() => {
    if (!snapshot) return "Battle V2 Observatory";
    const z = snapshot.pointer.zFightCandidates.length;
    const sort = snapshot.pointer.sortThrashCandidates.length;
    if (z > 0) return `Battle V2 Observatory · ${z} z candidates`;
    if (sort > 0) return `Battle V2 Observatory · ${sort} transparent nearby`;
    return "Battle V2 Observatory";
  }, [snapshot]);

  if (!enabled) {
    return (
      <button
        type="button"
        className="battle-observability-tab"
        onClick={onToggleEnabled}
      >
        OBS
      </button>
    );
  }

  return (
    <aside className={`battle-observability battle-observability--${tone}`}>
      <header className="battle-observability__header">
        <div>
          <div className="battle-observability__eyebrow">F10 · F12 dump · L lock</div>
          <h2>{title}</h2>
        </div>
        <div className="battle-observability__actions">
          <button type="button" onClick={onToggleLocked}>
            {locked ? "Unlock" : "Lock"}
          </button>
          <button type="button" onClick={onToggleEnabled}>
            Close
          </button>
        </div>
      </header>

      <section className="battle-observability__grid">
        <div>
          <span>RAF</span>
          <strong>{rafStats.samples ? fmt(rafStats.fps) : "--"}</strong>
        </div>
        <div>
          <span>R3F</span>
          <strong>{snapshot ? fmt(snapshot.frame.fps) : "--"}</strong>
        </div>
        <div>
          <span>p95</span>
          <strong>
            {snapshot ? `${fmt(snapshot.frame.frameMsP95)}ms` : "--"}
          </strong>
        </div>
        <div>
          <span>calls</span>
          <strong>{snapshot?.renderer.calls ?? "--"}</strong>
        </div>
        <div>
          <span>tris</span>
          <strong>{snapshot ? Math.round(snapshot.renderer.triangles / 1000) : "--"}k</strong>
        </div>
        <div>
          <span>meshes</span>
          <strong>{snapshot?.scene.meshes ?? "--"}</strong>
        </div>
        <div>
          <span>transparent</span>
          <strong>{snapshot?.scene.transparentMeshes ?? "--"}</strong>
        </div>
        <div>
          <span>DPR</span>
          <strong>{snapshot ? fmt(snapshot.renderer.pixelRatio) : "--"}</strong>
        </div>
        <div>
          <span>tasks 5s</span>
          <strong>
            {latestLongTask > 0
              ? `${recentLongTasks.length}/${fmt(latestLongTask, 0)}ms`
              : "none"}
          </strong>
        </div>
      </section>

      <section className="battle-observability__section">
        <h3>Pointer Hit</h3>
        <p>{snapshot?.pointer.hitName ?? "Move over the world canvas"}</p>
        {snapshot?.pointer.hitPoint ? (
          <code>
            [{snapshot.pointer.hitPoint.map((n) => fmt(n, 2)).join(", ")}]
          </code>
        ) : null}
      </section>

      <section className="battle-observability__section">
        <h3>Z-Fight Candidates</h3>
        {snapshot?.pointer.zFightCandidates.length ? (
          <ol className="battle-observability__list">
            {snapshot.pointer.zFightCandidates.slice(0, 5).map((candidate, index) => (
              <li key={`${candidate.a}-${candidate.b}-${index}`}>
                <b>{fmt(candidate.deltaYmm, 2)}mm</b>
                <span>{candidate.a}</span>
                <span>{candidate.b}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>None near the current hit.</p>
        )}
      </section>

      <section className="battle-observability__section">
        <h3>Transparent Nearby</h3>
        {snapshot?.pointer.sortThrashCandidates.length ? (
          <ol className="battle-observability__list">
            {snapshot.pointer.sortThrashCandidates.slice(0, 5).map((candidate, index) => (
              <li key={`${candidate.name}-${index}`}>
                <b>{fmt(candidate.distance, 2)}m</b>
                <span>{candidate.name}</span>
                <span>opacity {fmt(candidate.opacity, 2)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>None near the current hit.</p>
        )}
      </section>
    </aside>
  );
}
