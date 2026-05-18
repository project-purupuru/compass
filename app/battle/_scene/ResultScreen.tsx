"use client";

/**
 * ResultScreen — 1:1 port of world-purupuru ResultScreen.svelte.
 * "Never Victory/Defeat" per Gumi GDD. Tidal outcome language.
 * CSS: app/battle/_styles/ResultScreen.css
 */

import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import type { RoundResult } from "@/lib/honeycomb/clash.port";

interface ResultScreenProps {
  readonly winner: "p1" | "p2" | "draw" | null;
  readonly weather: Element;
  readonly opponentElement: Element;
  readonly playerElement: Element | null;
  readonly rounds: readonly RoundResult[];
  readonly whisper?: string;
  readonly record?: { wins: number; losses: number; draws: number };
  readonly challengeScore?: { wins: number; losses: number } | null;
}

export function ResultScreen({
  winner,
  playerElement,
  rounds,
  whisper = "the tide carries.",
  record = { wins: 0, losses: 0, draws: 0 },
  challengeScore = null,
}: ResultScreenProps) {
  // Derive playerWins / opponentWins from rounds (count of clashes lost by p2 vs p1)
  let playerWins = 0;
  let opponentWins = 0;
  for (const r of rounds) {
    for (const c of r.clashes) {
      if (c.loser === "p2") playerWins++;
      else if (c.loser === "p1") opponentWins++;
    }
  }

  const playerWon = winner === "p1";
  const opponentWon = winner === "p2";
  const isDraw = winner === "draw" || winner === null;

  const wrapperCls = [
    "result-ambient",
    playerWon && "result-win",
    opponentWon && "result-lose",
    isDraw && "result-draw",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperCls}>
      <span className="result-outcome">
        {playerWon
          ? `the tide favored ${playerElement ? ELEMENT_META[playerElement].kanji : ""}`
          : opponentWon
            ? "the tide shifts"
            : "the tides are even"}
      </span>

      <span className="result-record">
        <span className={playerWon ? "record-highlight" : undefined}>{record.wins}W</span>
        <span className="record-sep">·</span>
        <span className={opponentWon ? "record-highlight" : undefined}>{record.losses}L</span>
        <span className="record-sep">·</span>
        <span>{record.draws}D</span>
      </span>

      <span className="result-score">
        {playerWins}–{opponentWins}
      </span>

      <p className="result-message">{whisper}</p>

      {challengeScore && (
        <ChallengeCompare
          myW={playerWins}
          myL={opponentWins}
          theirW={challengeScore.wins}
          theirL={challengeScore.losses}
        />
      )}
    </div>
  );
}

function ChallengeCompare({
  myW,
  myL,
  theirW,
  theirL,
}: {
  readonly myW: number;
  readonly myL: number;
  readonly theirW: number;
  readonly theirL: number;
}) {
  const iWon = myW > theirW || (myW === theirW && myL < theirL);
  const tied = myW === theirW && myL === theirL;
  return (
    <div className="challenge-compare">
      <div className="compare-row">
        <span className="compare-label">you</span>
        <span className="compare-score">
          {myW}-{myL}
        </span>
      </div>
      <div className="compare-row compare-row--them">
        <span className="compare-label">them</span>
        <span className="compare-score">
          {theirW}-{theirL}
        </span>
      </div>
      <span
        className={[
          "compare-verdict",
          iWon && "compare-won",
          tied && "compare-tied",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {tied ? "tied." : iWon ? "you won." : "they won."}
      </span>
    </div>
  );
}
