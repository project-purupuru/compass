"use client";

/**
 * PhaseScrubber — dev-only force-set phase buttons.
 *
 * Mounted inside DevConsole. Dispatches `dev:force-phase` commands
 * (NODE_ENV gated in match.live.ts).
 */

import { matchCommand, useMatch } from "@/lib/runtime/match.client";
import type { MatchPhase } from "@/lib/honeycomb/match.port";

const PHASES: readonly MatchPhase[] = [
  "idle",
  "entry",
  "quiz",
  "select",
  "arrange",
  "committed",
  "clashing",
  "disintegrating",
  "between-rounds",
  "result",
];

export function PhaseScrubber() {
  const snap = useMatch();
  const current = snap?.phase ?? "idle";
  return (
    <section className="dev-section">
      <h3 className="dev-h3">phase</h3>
      <div className="dev-phase-grid">
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            className={`dev-phase-btn${p === current ? " dev-phase-btn--active" : ""}`}
            onClick={() => matchCommand.dispatch({ _tag: "dev:force-phase", phase: p })}
            data-phase={p}
            title={`Force phase: ${p}`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="dev-action-row">
        <button
          type="button"
          className="dev-action-btn"
          onClick={() => matchCommand.resetMatch()}
          title="Reset match (interrupts reveal)"
        >
          reset
        </button>
        <button
          type="button"
          className="dev-action-btn"
          onClick={() => matchCommand.beginMatch()}
          title="Begin match → entry"
        >
          begin
        </button>
      </div>
    </section>
  );
}
