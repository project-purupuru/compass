/**
 * ClashArena — the clash surface, layered over the living world.
 *
 * Pure render + dispatch. The match *truth* lives in the MatchEngine Effect
 * service (lib/cards/battle/match-engine) — this component subscribes to its
 * state stream via `useMatch()` and dispatches through `matchEngine`. It owns
 * no game state and no timers: the clash-advance cadence is the engine's
 * fiber, the world reaction is driven off the engine's event stream (BattleV2
 * subscribes). The only local state here is transient UI gesture state
 * (tap-selection, drag indices).
 *
 * The helper band sits in the top cluster — vertically stacked, content
 * phasing per stage — so the centre of the world stays clear.
 *
 * cycle-1 scope: a fixed starting hand vs a generated PvE opponent.
 */

"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Crosshair,
  Leaf,
  Link,
  Link2,
  RefreshCw,
  Sun,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { BattleCard } from "@/lib/cards/battle";
import { CardStack } from "@/lib/cards/layers";
import { detectCombos, type Combo } from "@/lib/cards/synergy";
import { matchEngine, useMatch } from "@/lib/runtime/react";

import "./clash-arena.css";

/** How long a round-start announcement lingers before fading out. */
const ROUND_ANNOUNCE_MS = 2500;

/** Combo name → lucide icon. The synergy substrate ships emoji icons for the
 *  vocab; the chip surface upgrades them to line-art icons matching the rest
 *  of the HUD register. {Element} Surge matched by suffix below. */
const COMBO_ICON: Record<string, LucideIcon> = {
  "Shēng Link": Link2,
  "Shēng Chain": Link,
  "Shēng Flow": Waves,
  "Full Cycle": RefreshCw,
  "Setup Strike": Crosshair,
  "Weather Blessing": Sun,
  "Garden Grace": Leaf,
};

function comboIcon(name: string): LucideIcon | null {
  if (COMBO_ICON[name]) return COMBO_ICON[name];
  if (name.endsWith(" Surge")) return Zap;
  return null;
}

// ── synergy chips ───────────────────────────────────────────────────────────

function SynergyChips({ combos }: { readonly combos: readonly Combo[] }) {
  if (combos.length === 0) {
    return <span className="clash-chips__empty">no synergies</span>;
  }
  return (
    <div className="clash-chips" aria-live="polite">
      {combos.map((c) => {
        const Icon = comboIcon(c.name);
        return (
          <span key={c.id} className="clash-chip" title={c.tooltip}>
            <span className="clash-chip__icon" aria-hidden="true">
              {Icon ? <Icon size={13} strokeWidth={2.2} /> : c.icon}
            </span>
            <span className="clash-chip__name">{c.name}</span>
            <span className="clash-chip__bonus">+{Math.round((c.bonus - 1) * 100)}%</span>
          </span>
        );
      })}
    </div>
  );
}

// ── a card's art + optional 敗 stamp ────────────────────────────────────────

function CardArt({ card, stamped }: { readonly card: BattleCard; readonly stamped: boolean }) {
  return (
    <motion.span
      className="clash-card__art"
      animate={{ scale: stamped ? 0.86 : 1, opacity: stamped ? 0.5 : 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
    >
      <CardStack element={card.element} rarity={card.rarity} alt={card.name} />
      {stamped ? (
        <motion.span
          className="bai-stamp"
          aria-hidden="true"
          initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
        >
          敗
        </motion.span>
      ) : null}
    </motion.span>
  );
}

// ── opponent card — flips face-up when the lineups reveal ───────────────────

function OpponentCard({
  card,
  revealed,
  stamped,
  index,
}: {
  readonly card: BattleCard;
  readonly revealed: boolean;
  readonly stamped: boolean;
  readonly index: number;
}) {
  return (
    <div className="clash-card flip-card">
      <motion.div
        className="flip-card__inner"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 22,
          delay: revealed ? index * 0.1 : 0,
        }}
      >
        <div className="flip-card__face flip-card__face--back">
          <img className="flip-card__mark" src="/brand/purupuru-wordmark-white.svg" alt="" />
        </div>
        <div className="flip-card__face flip-card__face--front">
          <CardArt card={card} stamped={stamped} />
        </div>
      </motion.div>
    </div>
  );
}

// ── round herald — transient announcement at each round-start ─────────────

function RoundAnnounce({ round }: { readonly round: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), ROUND_ANNOUNCE_MS);
    return () => clearTimeout(t);
  }, [round]);
  // Anchor handles centering (flex over the full arena); motion handles the
  // animation transform on the inner element — no transform contention.
  return (
    <div className="round-announce-anchor">
      <AnimatePresence>
        {visible ? (
          <motion.div
            key={round}
            className="round-announce"
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.04 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Round {round}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ── match verdict — the big "you won / you lost" at result phase ──────────

function MatchResult({
  winner,
}: {
  readonly winner: "player" | "opponent" | "draw";
}) {
  const text = winner === "player" ? "You Won" : winner === "opponent" ? "You Lost" : "Draw";
  return (
    <div className="round-announce-anchor">
      <motion.div
        className={`match-result match-result--${winner}`}
        initial={{ opacity: 0, scale: 0.92, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {text}
      </motion.div>
    </div>
  );
}

// ── ClashArena ──────────────────────────────────────────────────────────────

export function ClashArena() {
  const state = useMatch();
  const [selected, setSelected] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Clear any stale tap-selection when the phase leaves arrange.
  useEffect(() => {
    if (state && state.phase !== "arrange" && state.phase !== "between-rounds") {
      setSelected(null);
    }
  }, [state]);

  // First frame — the engine's state stream hasn't emitted yet.
  if (!state) return <div className="clash-arena" aria-hidden />;

  const arranging = state.phase === "arrange" || state.phase === "between-rounds";
  const revealed = state.phase === "clashing" || state.phase === "result";

  // ── stamped uids — losers among the clashes revealed so far ──
  const playerStamped = new Set<string>();
  const opponentStamped = new Set<string>();
  if (state.roundResult) {
    for (let i = 0; i < state.revealedClashes; i++) {
      const c = state.roundResult.clashes[i];
      if (c.loser === "p1") playerStamped.add(c.p1Card.uid);
      else if (c.loser === "p2") opponentStamped.add(c.p2Card.uid);
    }
  }

  const playerCombos = detectCombos(state.playerLineup, state.weather);
  const opponentCombos = detectCombos(state.opponentLineup, state.weather);

  // ── reorder gestures (arrange / between-rounds only) → dispatch to engine ──
  const swap = (a: number, b: number) => {
    const next = [...state.playerLineup];
    [next[a], next[b]] = [next[b], next[a]];
    matchEngine.setLineup(next);
  };
  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...state.playerLineup];
    const [card] = next.splice(from, 1);
    next.splice(to, 0, card);
    matchEngine.setLineup(next);
  };
  const onTap = (i: number) => {
    if (!arranging) return;
    if (selected === null) {
      setSelected(i);
      return;
    }
    if (selected === i) {
      setSelected(null);
      return;
    }
    swap(selected, i);
    setSelected(null);
  };

  return (
    <div className="clash-arena">
      {/* ── opponent — pinned top ── */}
      <section className="clash-side clash-side--opponent">
        <span className="clash-label">Opponent</span>
        <div className="clash-hand">
          {state.opponentLineup.map((card, i) => (
            <OpponentCard
              key={card.uid}
              card={card}
              revealed={revealed}
              stamped={opponentStamped.has(card.uid)}
              index={i}
            />
          ))}
        </div>
        {revealed ? <SynergyChips combos={opponentCombos} /> : null}
      </section>

      {/* ── the round herald — appears at each round-start, then fades.
            The match's voice (arrange hint · clash narration · result) is
            spoken by the CaretakerCorner's bubble, not floated here. ── */}
      <RoundAnnounce round={state.round} />

      {/* ── the verdict — big "you won / you lost" at result phase ── */}
      {state.phase === "result" && state.winner ? (
        <MatchResult winner={state.winner} />
      ) : null}

      {/* ── the centre stays empty — the world breathes here ── */}

      {/* ── your lineup — bottom of the world ── */}
      <section className="clash-side clash-side--player">
        <div className="clash-hand">
          {state.playerLineup.map((card, i) => (
            <motion.button
              key={card.uid}
              type="button"
              layout
              draggable={arranging}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIdx !== i) setOverIdx(i);
              }}
              onDrop={() => {
                if (dragIdx !== null) move(dragIdx, i);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              animate={{
                scale: overIdx === i && dragIdx !== i ? 1.06 : 1,
                opacity: dragIdx === i ? 0.4 : 1,
              }}
              whileHover={arranging ? { y: -5 } : undefined}
              whileTap={arranging ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={`clash-card clash-card--btn clash-card--${card.element}${
                selected === i ? " is-selected" : ""
              }${arranging ? "" : " is-locked"}`}
              onClick={() => onTap(i)}
              aria-label={`${card.name} — position ${i + 1}`}
            >
              <CardArt card={card} stamped={playerStamped.has(card.uid)} />
              <span className="clash-card__name">{card.name}</span>
            </motion.button>
          ))}
        </div>
        <SynergyChips combos={playerCombos} />
        <div className="clash-action">
          {arranging ? (
            <button type="button" className="clash-btn" onClick={() => matchEngine.lockIn()}>
              Lock In
            </button>
          ) : null}
          {state.phase === "clashing" ? (
            <span className="clash-btn clash-btn--ghost">Clashing…</span>
          ) : null}
          {state.phase === "result" ? (
            <button type="button" className="clash-btn" onClick={() => matchEngine.restart()}>
              Play Again
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
