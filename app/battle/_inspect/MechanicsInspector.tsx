"use client";

/**
 * MechanicsInspector — live readout of every active substrate mechanic.
 *
 * The diagnostic surface that closes the gap reported on 2026-05-12:
 * "Lots of small visual glitches that I'm seeing and inconsistencies."
 *
 * The substrate has ~28 distinct mechanics; the player UI surfaces ~7 of
 * them. This pane surfaces ALL of them in human language while a match
 * is in flight, so the builder can see what's firing, decide whether it
 * deserves a player-facing affordance, and design accordingly.
 *
 * Doctrine: see grimoires/loa/proposals/mechanics-legibility-audit.md
 *
 * Reads the snapshot every tick (via useMatch) — no separate subscription.
 * NODE_ENV gated by parent DevConsole, so this file never ships to prod.
 */

import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import type { Combo } from "@/lib/honeycomb/combos";
import { getPositionMultiplier } from "@/lib/honeycomb/combos";
import type { MatchSnapshot } from "@/lib/honeycomb/match.port";
import { useMatch } from "@/lib/runtime/match.client";

export function MechanicsInspector() {
  const snap = useMatch();
  if (!snap) return <p className="dev-empty">no snapshot</p>;

  return (
    <section className="dev-section dev-mechanics">
      <h3 className="dev-h3">mechanics · live</h3>
      <ul className="dev-mech-list">
        <PhaseLine snap={snap} />
        <WeatherLine snap={snap} />
        <ConditionLine snap={snap} />
        <PlayerElementLine snap={snap} />
        <LineupLine snap={snap} />
        <CombosBlock snap={snap} />
        <PerCardMultiplierBlock snap={snap} />
        <CaretakerAdaptBlock snap={snap} />
        <CaretakerShieldStatus snap={snap} />
        <TranscendenceBlock snap={snap} />
        <ChainBonusLine snap={snap} />
        <ClashSequenceBlock snap={snap} />
        <TideLine snap={snap} />
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Per-mechanic readout components. Each returns 1+ <li> rows.
// ─────────────────────────────────────────────────────────────────

function PhaseLine({ snap }: { readonly snap: MatchSnapshot }) {
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">⏱</span>
      <span className="dev-mech-label">phase</span>
      <span className="dev-mech-value">
        {snap.phase}
        {snap.currentRound > 0 ? ` · round ${snap.currentRound}` : ""}
      </span>
    </li>
  );
}

function WeatherLine({ snap }: { readonly snap: MatchSnapshot }) {
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon" data-element={snap.weather}>
        {ELEMENT_META[snap.weather].kanji}
      </span>
      <span className="dev-mech-label">weather</span>
      <span className="dev-mech-value">
        {snap.weather} · favors generated element
      </span>
    </li>
  );
}

function ConditionLine({ snap }: { readonly snap: MatchSnapshot }) {
  const c = snap.condition;
  let explain: string;
  switch (c.effect.type) {
    case "position_scale":
      explain = `position scale: ${c.effect.scales.map((s) => s.toFixed(2)).join(" · ")}`;
      break;
    case "precise":
      explain = "largest shift × 2";
      break;
    case "tidal":
      explain = `all shifts × ${c.effect.multiplier}`;
      break;
    case "entrenched":
      explain = "size ties favor the bigger side";
      break;
  }
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">⚑</span>
      <span className="dev-mech-label">condition</span>
      <span className="dev-mech-value">
        <strong>{c.name}</strong> ({c.element}) · {explain}
      </span>
    </li>
  );
}

function PlayerElementLine({ snap }: { readonly snap: MatchSnapshot }) {
  if (!snap.playerElement) return null;
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon" data-element={snap.playerElement}>
        {ELEMENT_META[snap.playerElement].kanji}
      </span>
      <span className="dev-mech-label">you</span>
      <span className="dev-mech-value">
        {ELEMENT_META[snap.playerElement].caretaker} ({snap.playerElement})
      </span>
    </li>
  );
}

function LineupLine({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.p1Lineup.length === 0 && snap.p2Lineup.length === 0) return null;
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">⚔</span>
      <span className="dev-mech-label">lineups</span>
      <span className="dev-mech-value">
        you {snap.p1Lineup.length} · opp {snap.p2Lineup.length}
        {snap.p1Lineup.length !== snap.p2Lineup.length && (
          <em className="dev-mech-note">
            {" "}· size diff → tiebreak favors {snap.p1Lineup.length > snap.p2Lineup.length ? "you" : "opp"}
          </em>
        )}
      </span>
    </li>
  );
}

function CombosBlock({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.p1Combos.length === 0) return null;
  return (
    <>
      {snap.p1Combos.map((combo) => (
        <ComboRow key={combo.id} combo={combo} />
      ))}
    </>
  );
}

function ComboRow({ combo }: { readonly combo: Combo }) {
  const icon =
    combo.kind === "sheng-chain"
      ? "相"
      : combo.kind === "setup-strike"
        ? "的"
        : combo.kind === "elemental-surge"
          ? "極"
          : "天"; // weather-blessing
  const bonusPct = Math.round(combo.bonus * 100);
  return (
    <li className="dev-mech-row" data-kind={combo.kind}>
      <span className="dev-mech-icon">{icon}</span>
      <span className="dev-mech-label">{combo.name}</span>
      <span className="dev-mech-value">
        +{bonusPct}% to [{combo.affected.join(",")}]
      </span>
    </li>
  );
}

function PerCardMultiplierBlock({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.p1Lineup.length === 0) return null;
  const multipliers = snap.p1Lineup.map((_, i) =>
    getPositionMultiplier(i, snap.p1Combos),
  );
  const anyAboveOne = multipliers.some((m) => m > 1.0);
  if (!anyAboveOne) return null;
  return (
    <li className="dev-mech-row dev-mech-row--wide">
      <span className="dev-mech-icon">∑</span>
      <span className="dev-mech-label">per-card mult</span>
      <span className="dev-mech-value dev-mech-multipliers">
        {multipliers.map((m, i) => (
          <span
            key={i}
            className="dev-mech-mult"
            data-bonus={m > 1.0 ? "" : undefined}
          >
            {m === 1 ? "1.00" : `${m.toFixed(2)}×`}
          </span>
        ))}
      </span>
    </li>
  );
}

function CaretakerAdaptBlock({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.currentRound < 1) return null;
  const adapting = snap.p1Lineup
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c?.cardType === "caretaker_b");
  if (adapting.length === 0) return null;
  const willAdapt = snap.currentRound >= 1; // R2+
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">⇌</span>
      <span className="dev-mech-label">Caretaker B Adapt</span>
      <span className="dev-mech-value">
        positions [{adapting.map((a) => a.i).join(",")}] {willAdapt ? "become" : "will become"}{" "}
        <strong>{snap.weather}</strong> in R2+
      </span>
    </li>
  );
}

function CaretakerShieldStatus({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.phase === "idle" || snap.phase === "entry") return null;
  const alive = snap.p1Lineup
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c?.cardType === "caretaker_a");
  if (alive.length === 0) return null;
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">✦</span>
      <span className="dev-mech-label">Caretaker A Shield</span>
      <span className="dev-mech-value">
        ready at positions [{alive.map((a) => a.i).join(",")}] · saves adjacent ally
      </span>
    </li>
  );
}

function TranscendenceBlock({ snap }: { readonly snap: MatchSnapshot }) {
  const trans = snap.p1Lineup
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c?.cardType === "transcendence");
  if (trans.length === 0) return null;
  return (
    <>
      {trans.map(({ c, i }) => (
        <li key={i} className="dev-mech-row" data-kind="transcendence">
          <span className="dev-mech-icon">無</span>
          <span className="dev-mech-label">Transcendence @ {i}</span>
          <span className="dev-mech-value">{describeTranscendence(c?.defId)}</span>
        </li>
      ))}
    </>
  );
}

function describeTranscendence(defId: string | undefined): string {
  if (!defId) return "?";
  if (defId === "transcendence-forge")
    return "Forge — becomes the element that overcomes opponent";
  if (defId === "transcendence-void")
    return "Void — mirrors opponent power + element";
  if (defId === "transcendence-garden")
    return "Garden — preserves chain bonus if it survives";
  return defId;
}

function ChainBonusLine({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.chainBonusAtRoundStart === 0) return null;
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">↻</span>
      <span className="dev-mech-label">chain bonus carried</span>
      <span className="dev-mech-value">
        +{Math.round(snap.chainBonusAtRoundStart * 100)}% from prior round (Garden grace)
      </span>
    </li>
  );
}

function ClashSequenceBlock({ snap }: { readonly snap: MatchSnapshot }) {
  if (snap.clashSequence.length === 0) return null;
  return (
    <li className="dev-mech-row dev-mech-row--wide">
      <span className="dev-mech-icon">⚡</span>
      <span className="dev-mech-label">clash seq</span>
      <span className="dev-mech-value dev-mech-clashes">
        {snap.clashSequence.map((c, i) => {
          const revealed = i <= snap.visibleClashIdx;
          const symbol =
            c.loser === "p1" ? "✗" : c.loser === "p2" ? "✓" : "=";
          return (
            <span
              key={i}
              className="dev-mech-clash"
              data-revealed={revealed ? "" : undefined}
              data-loser={c.loser}
              title={`${c.p1Card.card.element} vs ${c.p2Card.card.element} · ${c.reason}`}
            >
              {symbol}
            </span>
          );
        })}
      </span>
    </li>
  );
}

function TideLine({ snap }: { readonly snap: MatchSnapshot }) {
  const delta = snap.playerClashWins - snap.opponentClashWins;
  if (snap.playerClashWins + snap.opponentClashWins === 0) return null;
  const dir = delta > 0 ? "your way" : delta < 0 ? "their way" : "even";
  return (
    <li className="dev-mech-row">
      <span className="dev-mech-icon">∿</span>
      <span className="dev-mech-label">tide</span>
      <span className="dev-mech-value">
        {snap.playerClashWins}–{snap.opponentClashWins} · leaning {dir}
      </span>
    </li>
  );
}

// Silence unused-export warning for the Element re-import path
export type _MechanicsInspectorElement = Element;
