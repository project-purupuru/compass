"use client";

/**
 * SeedReplayPanel — seed-driven match replay. Q-SDD-7.
 *
 * Shows current match seed. Allows operator to enter a custom seed and
 * reset the match — useful for reproducing operator-found issues.
 */

import { useState } from "react";
import { useMatch, matchCommand } from "@/lib/runtime/match.client";

export function SeedReplayPanel() {
  const snap = useMatch();
  const [customSeed, setCustomSeed] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-2xs font-puru-mono uppercase tracking-wide text-puru-ink-dim">
          Current seed
        </span>
        <code className="text-xs font-puru-mono text-puru-ink-rich break-all bg-puru-cloud-dim/40 px-2 py-1 rounded">
          {snap?.seed ?? "(loading)"}
        </code>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-2xs font-puru-mono uppercase tracking-wide text-puru-ink-dim">
          Replay seed
        </label>
        <input
          type="text"
          value={customSeed}
          onChange={(e) => setCustomSeed(e.target.value)}
          placeholder="e.g. compass-genesis"
          className="text-xs font-puru-mono px-2 py-1 rounded bg-puru-cloud-bright border border-puru-cloud-deep/40 text-puru-ink-base focus:outline-none focus:ring-1 focus:ring-puru-honey-base"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => matchCommand.resetMatch(customSeed || undefined)}
          className="flex-1 px-3 py-1.5 rounded-full bg-puru-honey-base text-puru-ink-rich text-xs font-puru-display shadow-puru-tile hover:shadow-puru-tile-hover transition-shadow"
        >
          Reset with seed
        </button>
        <button
          type="button"
          onClick={() => matchCommand.resetMatch()}
          className="flex-1 px-3 py-1.5 rounded-full bg-puru-cloud-bright text-puru-ink-rich text-xs font-puru-display shadow-puru-tile hover:shadow-puru-tile-hover transition-shadow"
        >
          Random
        </button>
      </div>
      <p className="text-2xs font-puru-body text-puru-ink-ghost italic">
        Same seed reproduces the same starter collection, opponent, conditions, and whisper
        sequence.
      </p>
    </div>
  );
}
