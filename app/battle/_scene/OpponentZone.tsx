"use client";

/**
 * OpponentZone — 1:1 port of world-purupuru OpponentZone.svelte.
 * Face-down during arrange · revealed during clash/result · per-card clash
 * approach/impact/settle classes. CSS: app/battle/_styles/OpponentZone.css
 */

import type { Card } from "@/lib/honeycomb/cards";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import { CardStack } from "@/lib/cards/layers";

export type OpponentZoneArenaPhase = "rearrange" | "locked" | "clashing" | "result";

interface OpponentZoneProps {
  readonly lineup: readonly Card[];
  readonly arenaPhase: OpponentZoneArenaPhase;
  readonly opponentElement: Element;
  readonly visibleClashIdx?: number;
  readonly activeClashPhase?: "approach" | "impact" | "settle" | null;
  readonly clashWinners?: ReadonlyMap<number, "player" | "opponent">;
  readonly stamps?: ReadonlySet<number>;
  readonly dying?: ReadonlySet<number>;
  readonly shielded?: ReadonlySet<number>;
}

export function OpponentZone({
  lineup,
  arenaPhase,
  visibleClashIdx = -1,
  activeClashPhase = null,
  clashWinners,
  stamps,
  dying,
  shielded,
}: OpponentZoneProps) {
  const isArrange = arenaPhase === "rearrange";
  const isLocked = arenaPhase === "locked";
  const isClashing = arenaPhase === "clashing";
  const isResult = arenaPhase === "result";

  return (
    <div className="opponent-zone">
      <div className="lineup opponent-lineup">
        <div
          className={`lineup-row${activeClashPhase !== null ? " has-active-clash" : ""}`}
        >
          {lineup.map((card, i) => {
            const winner = clashWinners?.get(i);
            const isDying = dying?.has(i) ?? false;
            const isShielded = shielded?.has(i) ?? false;
            // Opponent perspective: winner === "player" means the OPPONENT
            // card at this position lost. Shielded opponent positions
            // suppress the 敗 + .lost combo for the same legibility reason.
            const opponentLost = winner === "player" && stamps?.has(i) && !isShielded;
            const opponentWon = winner === "opponent" && stamps?.has(i);
            const cls = [
              "card-slot",
              "opponent-card",
              isArrange && "face-down",
              (isLocked || isClashing || isResult) && "revealed",
              opponentLost && "lost",
              opponentWon && "won",
              isShielded && "shielded",
              isDying && "disintegrating",
              activeClashPhase === "approach" && visibleClashIdx === i && "clashing-approach",
              activeClashPhase === "impact" && visibleClashIdx === i && "clashing-impact",
              activeClashPhase === "settle" && visibleClashIdx === i && "clashing-settle",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={card.id}
                className={cls}
                data-element={card.element}
                style={{ "--card-idx": i } as React.CSSProperties}
              >
                {isArrange ? (
                  <CardStack
                    className="card-back"
                    element={card.element}
                    cardType={card.cardType}
                    face="back"
                    alt="face down"
                  />
                ) : (
                  <>
                    <CardStack
                      className="card-art"
                      element={card.element}
                      cardType={card.cardType}
                      face="front"
                      alt={`${ELEMENT_META[card.element].caretaker} · ${card.cardType}`}
                    />
                    <span
                      className="card-foil"
                      style={{ "--foil-delay": `${i * 0.6 + 3}s` } as React.CSSProperties}
                      aria-hidden
                    />
                    <span className="card-kanji">{ELEMENT_META[card.element].kanji}</span>
                  </>
                )}
                {opponentLost && (
                  <>
                    <span className="stamp">敗</span>
                    <span className="floor-pulse floor-pulse--lose" />
                  </>
                )}
                {opponentWon && (
                  <span className="floor-pulse floor-pulse--win" data-element={card.element} />
                )}
                {isShielded && (
                  <span
                    className="shield-burst"
                    data-element={card.element}
                    aria-label="Saved by Caretaker A Shield"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
