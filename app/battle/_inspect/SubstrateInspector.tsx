"use client";

/**
 * SubstrateInspector — live read of Match.current. Q-SDD-7.
 *
 * Pre-formatted highlights (NOT raw JSON dump) so the operator can scan
 * substrate state at a glance.
 */

import { useMatch } from "@/lib/runtime/match.client";

export function SubstrateInspector() {
  const snap = useMatch();
  if (!snap) {
    return <p className="text-2xs font-puru-mono text-puru-ink-ghost">snapshot pending…</p>;
  }
  return (
    <div className="flex flex-col gap-1.5 text-2xs font-puru-mono text-puru-ink-base">
      <Row k="phase" v={snap.phase} />
      <Row k="seed" v={snap.seed} />
      <Row k="weather" v={`${snap.weather} (today)`} />
      <Row k="opponent" v={`${snap.opponentElement} · ${snap.condition.name}`} />
      <Row k="player el" v={snap.playerElement ?? "(unset)"} />
      <Row k="tutorial" v={snap.hasSeenTutorial ? "seen" : "first-time"} />
      <Row k="collection" v={`${snap.collection.length} cards`} />
      <Row k="selected" v={`[${snap.selectedIndices.join(",")}]`} />
      <Row k="p1 lineup" v={`${snap.p1Lineup.length} cards`} />
      <Row k="p2 lineup" v={`${snap.p2Lineup.length} cards`} />
      <Row k="round" v={snap.currentRound} />
      <Row k="combos" v={snap.p1Combos.length} />
      <Row k="winner" v={snap.winner ?? "—"} />
      <Row k="chain bonus" v={snap.chainBonusAtRoundStart.toFixed(2)} />
    </div>
  );
}

function Row({ k, v }: { readonly k: string; readonly v: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-puru-ink-dim">{k}</span>
      <span className="text-puru-ink-rich truncate ml-2 max-w-[180px]">{v}</span>
    </div>
  );
}
