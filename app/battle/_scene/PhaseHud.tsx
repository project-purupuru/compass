"use client";

import type { BattlePhase } from "@/lib/honeycomb/battle.port";
import type { BattleCondition } from "@/lib/honeycomb/conditions";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import { ELEMENT_TINT_BG } from "./_element-classes";

interface PhaseHudProps {
  readonly phase: BattlePhase;
  readonly seed: string;
  readonly weather: Element;
  readonly opponentElement: Element;
  readonly condition: BattleCondition;
}

const PHASE_LABEL: Record<BattlePhase, string> = {
  idle: "stillness",
  select: "selecting",
  arrange: "arranging",
  preview: "previewing",
  committed: "committed",
};

export function PhaseHud({ phase, seed, weather, opponentElement, condition }: PhaseHudProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-puru-cloud-deep/40">
      <div className="flex items-center gap-3">
        <span
          className={`px-2.5 py-1 rounded-full text-2xs font-puru-mono uppercase tracking-wide ${ELEMENT_TINT_BG[weather]} text-puru-ink-rich`}
        >
          {ELEMENT_META[weather].kanji} {ELEMENT_META[weather].name}
        </span>
        <span className="text-xs font-puru-body text-puru-ink-soft">today's tide</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-puru-body text-puru-ink-soft">
        <span
          className={`px-2 py-0.5 rounded-full ${ELEMENT_TINT_BG[opponentElement]} text-puru-ink-rich font-puru-display`}
        >
          {condition.name}
        </span>
        <span className="text-puru-ink-dim">{condition.description}</span>
      </div>

      <div className="flex items-center gap-3 text-2xs font-puru-mono text-puru-ink-ghost">
        <span>{PHASE_LABEL[phase]}</span>
        <span>·</span>
        <span title={seed}>{seed.slice(0, 14)}</span>
      </div>
    </header>
  );
}
