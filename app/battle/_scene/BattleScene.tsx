"use client";

/**
 * BattleScene — 1:1 fidelity port of world-purupuru's lib/scenes/BattleScene.svelte.
 *
 * Routes on MatchPhase to render screens with matching DOM/classes/data-attrs
 * from world-purupuru's battle/ Svelte components. All CSS lives in
 * app/battle/_styles/battle.css and applies via class names directly.
 *
 * Dev tooling (KaironicPanel · DevConsole) lives in app/battle/_inspect/.
 */

import { useEffect, useState } from "react";
import { matchCommand, useMatch } from "@/lib/runtime/match.client";
import { useAudio } from "@/lib/audio/use-audio";
import type { Element } from "@/lib/honeycomb/wuxing";
import type { Card } from "@/lib/honeycomb/cards";
import { ArenaSpeakers } from "./ArenaSpeakers";
import { BattleField } from "./BattleField";
import { BattleHand } from "./BattleHand";
import { CardPetal } from "./CardPetal";
import { ClashOrb } from "./ClashOrb";
import { ClashVfx } from "./ClashVfx";
import { PixiClashVfx } from "./PixiClashVfx";
import { ComboDiscoveryToast } from "./ComboDiscoveryToast";
import { ParallaxLayer } from "./ParallaxLayer";
import { ElementQuiz } from "./ElementQuiz";
import { EntryScreen } from "./EntryScreen";
import { Guide } from "./Guide";
import { OpponentZone } from "./OpponentZone";
import { ResultScreen } from "./ResultScreen";
import { TurnClock } from "./TurnClock";

import "../_styles/battle.css";

export function BattleScene() {
  const snap = useMatch();
  const [toastActive, setToastActive] = useState(false);
  const [petalCard, setPetalCard] = useState<Card | null>(null);
  // Mount the audio engine + music director (subscribes to phase-entered)
  const audio = useAudio();
  // Per-clash impact SFX — fires on each impact phase as visibleClashIdx advances
  useEffect(() => {
    if (snap?.activeClashPhase === "impact" && snap.lastPlayed) {
      audio.playClashImpact(snap.lastPlayed);
    }
  }, [snap?.activeClashPhase, snap?.visibleClashIdx, snap?.lastPlayed, audio]);

  if (!snap) {
    return (
      <div className="battle-scene" data-scene="battle">
        <p className="loading-pill">honeycomb warming…</p>
      </div>
    );
  }

  // Map MatchPhase → world-purupuru's BattleScene visibility logic.
  const showQuiz = snap.phase === "entry" && snap.playerElement === null;
  const showEntry = snap.phase === "idle" || (snap.phase === "entry" && snap.playerElement !== null);
  const inArena = ["select", "arrange", "committed", "clashing", "disintegrating", "between-rounds"].includes(
    snap.phase,
  );
  const showResult = snap.phase === "result";

  // Derive world-purupuru-style props from Match snapshot.
  // energies: per-element 0..1 derived from collection composition + lineup.
  const energies = deriveEnergies(snap);
  const turnElement = snap.weather;
  // tide drifts toward the side that's winning clashes
  const tideDelta = snap.playerClashWins - snap.opponentClashWins;
  const tide = Math.max(0, Math.min(100, 50 + tideDelta * 12));
  const arenaPhase =
    snap.phase === "arrange" || snap.phase === "between-rounds"
      ? "rearrange"
      : snap.phase === "clashing" || snap.phase === "disintegrating"
        ? "clashing"
        : snap.phase === "result"
          ? "result"
          : "locked";

  // Build per-position clash-winner map for OpponentZone (uses visibleClashIdx range).
  const clashWinners = new Map<number, "player" | "opponent">();
  for (let i = 0; i <= snap.visibleClashIdx; i++) {
    const c = snap.clashSequence[i];
    if (!c) continue;
    if (c.loser === "p2") clashWinners.set(c.p2Card.position, "player");
    else if (c.loser === "p1") clashWinners.set(c.p1Card.position, "opponent");
  }

  const canLockIn = snap.phase === "arrange" || snap.phase === "between-rounds";

  return (
    <div className="battle-scene" data-scene="battle" aria-label="The Tide">
      {showQuiz && (
        <div className="quiz-wrapper">
          <ElementQuiz />
        </div>
      )}

      {showEntry && (
        <div className="entry-wrapper">
          <EntryScreen
            weather={snap.weather}
            quizElement={snap.playerElement}
            seed={snap.seed}
          />
        </div>
      )}

      {inArena && (
        <div className="battle-wrapper mounted">
          <BattleField
            energies={energies}
            turnElement={turnElement}
            tide={tide}
            animState={snap.animState}
            phase={mapToFieldPhase(snap.phase)}
            weather={snap.weather}
            backdrop
            arenaPhase={arenaPhase}
            lastPlayed={snap.lastPlayed}
            lastGenerated={snap.lastGenerated}
            lastOvercome={snap.lastOvercome}
          />

          {/* Canonical world-purupuru flex column: opponent at top, clash-zone
              in the middle (the actual meeting point), player at bottom.
              data-paused dims + freezes during ComboDiscoveryToast. */}
          <div
            className="arena"
            data-phase={snap.phase}
            data-paused={toastActive ? "" : undefined}
            style={
              {
                "--clash-slide": "500ms",
                "--clash-settle": "350ms",
              } as React.CSSProperties
            }
          >
            <OpponentZone
              lineup={snap.p2Lineup}
              arenaPhase={arenaPhase}
              opponentElement={snap.opponentElement}
              visibleClashIdx={snap.visibleClashIdx}
              activeClashPhase={snap.activeClashPhase}
              clashWinners={clashWinners}
              stamps={new Set(snap.stamps)}
              dying={new Set(snap.dyingP2)}
              shielded={new Set(snap.shieldedP2)}
            />

            {/* Clash zone — the visual middle. Cards converge here. The
                ClashOrb is the consequence bloom; ClashVfx is the per-
                element particle signature. Both fire on impact phase. */}
            <div className="clash-zone" aria-hidden>
              <ClashOrb
                clash={snap.clashSequence[snap.visibleClashIdx] ?? null}
                visibleClashIdx={snap.visibleClashIdx}
                totalClashes={snap.clashSequence.length}
                activeClashPhase={snap.activeClashPhase}
              />
              <ClashVfx
                element={snap.lastPlayed}
                visibleClashIdx={snap.visibleClashIdx}
                activeClashPhase={snap.activeClashPhase}
              />
              <PixiClashVfx
                element={snap.lastPlayed}
                visibleClashIdx={snap.visibleClashIdx}
                activeClashPhase={snap.activeClashPhase}
              />
            </div>

            <div className="player-zone">
              <RoundContextChip
                phase={snap.phase}
                currentRound={snap.currentRound}
                totalRounds={3}
              />
              <BattleHand
                cards={snap.p1Lineup}
                phase={snap.phase}
                turnElement={turnElement}
                selectedIndex={snap.selectedIndex}
                stamps={new Set(snap.stamps)}
                dying={new Set(snap.dyingP1)}
                visibleClashIdx={snap.visibleClashIdx}
                activeClashPhase={snap.activeClashPhase}
                clashWinners={clashWinners}
                shielded={new Set(snap.shieldedP1)}
                combos={snap.p1Combos}
                onTap={matchCommand.tapPosition}
                onSwap={matchCommand.swapPositions}
                onLongPress={(i) => {
                  const card = snap.p1Lineup[i];
                  if (card) {
                    audio.play("ui.tap");
                    setPetalCard(card);
                  }
                }}
              />

              <div className="action-bar">
                {canLockIn && (
                  <button
                    type="button"
                    className="tile-btn tile-btn--lock"
                    onClick={() => {
                      audio.play("ui.tap");
                      matchCommand.lockIn();
                    }}
                  >
                    Lock in
                  </button>
                )}
              </div>
            </div>
          </div>

          <ArenaSpeakers
            playerElement={snap.playerElement ?? snap.weather}
            opponentElement={snap.opponentElement}
            phase={snap.phase}
            whisper={snap.lastWhisper}
            playerWins={snap.playerClashWins}
            opponentWins={snap.opponentClashWins}
            activeClashPhase={snap.activeClashPhase}
          />
        </div>
      )}

      {showResult && (
        <div className="result-wrapper">
          <ResultScreen
            winner={snap.winner}
            weather={snap.weather}
            opponentElement={snap.opponentElement}
            playerElement={snap.playerElement}
            rounds={snap.rounds}
          />
        </div>
      )}

      {/* TurnClock floats above the arena */}
      {inArena && <TurnClock turnElement={turnElement} weather={snap.weather} />}

      {/* First-time combo discovery ceremony (FR-5) */}
      <ComboDiscoveryToast onActiveChange={setToastActive} />

      {/* Card detail modal — opens on long-press / right-click */}
      <CardPetal card={petalCard} onClose={() => setPetalCard(null)} />

      {/* Translation-only parallax camera (mousemove → CSS vars) */}
      <ParallaxLayer />

      {/* Guide overlay (tutorial / hints) */}
      <Guide />
    </div>
  );
}

/**
 * Round context chip — stage-dot indicator that mirrors world-purupuru.
 * 3 dots horizontally centered: filled = completed, outlined-active =
 * current, outlined = pending. Survivors line slips in below only when
 * the hand has shrunk during between-rounds (the drama beat).
 *
 * Position: as a sibling to the player-hand fan, vertically centered
 * via the row's flex shape. NEVER cut by viewport edges (the prior
 * "Round X of 3" pill snuck into the top safe-area on narrow viewports).
 */
function RoundContextChip({
  phase,
  currentRound,
  totalRounds,
}: {
  readonly phase: import("@/lib/honeycomb/match.port").MatchPhase;
  readonly currentRound: number;
  readonly totalRounds: number;
}) {
  if (!["arrange", "committed", "clashing", "disintegrating", "between-rounds"].includes(phase)) {
    return null;
  }
  const dots = Array.from({ length: totalRounds }, (_, i) => {
    const state = i < currentRound ? "done" : i === currentRound ? "active" : "pending";
    return state;
  });
  return (
    <div className="round-chip" data-phase={phase} aria-live="polite">
      <div
        className="round-chip__stages"
        role="progressbar"
        aria-label={`Round ${currentRound + 1} of ${totalRounds}`}
        aria-valuenow={currentRound + 1}
        aria-valuemax={totalRounds}
      >
        {dots.map((state, i) => (
          <span key={i} className={`round-chip__dot round-chip__dot--${state}`} />
        ))}
      </div>
    </div>
  );
}

/** Derive per-element energy 0..1 from p1Lineup composition. Stand-in until
 * Match service exposes actual energies tied to card-play history. */
function deriveEnergies(snap: import("@/lib/honeycomb/match.port").MatchSnapshot): Record<Element, number> {
  const base: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const c of snap.p1Lineup) base[c.element] += 0.2;
  // Combo-active elements get a boost
  for (const combo of snap.p1Combos) {
    for (const pos of combo.positions) {
      const card = snap.p1Lineup[pos];
      if (card) base[card.element] = Math.min(1, base[card.element] + 0.1);
    }
  }
  return base;
}

function mapToFieldPhase(
  phase: import("@/lib/honeycomb/match.port").MatchPhase,
): "selection" | "playing" | "result" {
  if (phase === "result") return "result";
  if (phase === "select" || phase === "arrange" || phase === "between-rounds") return "selection";
  return "playing";
}
