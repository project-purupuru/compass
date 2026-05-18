"use client";

/**
 * ComboDebug — per-position multiplier breakdown. Q-SDD-7.
 *
 * For each lineup position 1-5, shows: card defId, element, applied combo
 * names + bonus values. Useful for verifying combo detection.
 */

import { useMatch } from "@/lib/runtime/match.client";
import { getPositionMultiplier } from "@/lib/honeycomb/combos";

export function ComboDebug() {
  const snap = useMatch();
  if (!snap || snap.p1Lineup.length === 0) {
    return (
      <p className="text-2xs font-puru-mono text-puru-ink-ghost italic">
        no lineup · enter arrange phase to see combo breakdown
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-1.5 text-2xs font-puru-mono">
      {snap.p1Lineup.map((card, idx) => {
        const mult = getPositionMultiplier(idx, snap.p1Combos);
        const applied = snap.p1Combos.filter((c) => c.affected.includes(idx));
        return (
          <li
            key={card.id}
            className="flex flex-col gap-0.5 pb-1 border-b border-puru-cloud-deep/20 last:border-0"
          >
            <div className="flex justify-between">
              <span className="text-puru-ink-dim">pos {idx + 1}</span>
              <span className="text-puru-ink-rich">{card.defId}</span>
              <span className="text-puru-honey-base">×{mult.toFixed(2)}</span>
            </div>
            {applied.length > 0 && (
              <div className="flex flex-wrap gap-1 text-puru-ink-soft">
                {applied.map((c) => (
                  <span key={c.id} className="px-1.5 py-0.5 bg-puru-cloud-dim/40 rounded">
                    {c.name} +{Math.round(c.bonus * 100)}%
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })}
      <li className="pt-1 text-puru-honey-dim">
        Active: {snap.p1Combos.length} · Total bonus: +
        {Math.round(snap.p1Combos.reduce((s, c) => s + c.bonus * c.affected.length, 0) * 100)}%
      </li>
    </ol>
  );
}
