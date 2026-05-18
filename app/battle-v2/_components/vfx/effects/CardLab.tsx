/**
 * CardLab — card-to-map choreography lab as a vfx-lab effect entry.
 *
 * On lock-in, the orchestrator sequences through ALL 5 cards in the
 * lineup order (per operator 2026-05-17 — "when I lock in it plays all
 * of them in order so it should sequence everything together"). Each
 * card fires its tier-escalated typography moment + right-side showcase
 * stamp. The 5th card in a clean lineup triggers UltimateScreen.
 *
 * Architecture:
 *   - HandRack owns slot state + reorder; reports the lineup back via
 *     `onLineupChange` so we can sequence playback against the player's
 *     arrangement.
 *   - On lock-in: lineup is captured, state machine advances:
 *       idle → locked → breath → card-0 → card-1 → ... → card-N → finale → settle → idle
 *     Each card-N phase = ~1.2s: showcase appears, tier text fires mid-
 *     phase, settles. Between-cards buffer = 0.2s.
 *   - All DOM UI lives in LabPortal (independent React tree at document.body)
 *     so r3f's reconciler doesn't trip on HTML tags.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  HAND_RACK_DEFAULTS,
  HandRack,
} from "../../cardjuice/HandRack";
import { CardShowcase } from "../../cardjuice/CardShowcase";
import { HitText, TypographyPreview } from "../../cardjuice/HitText";
import { LabPortal } from "../../cardjuice/LabPortal";
import { LockInBar } from "../../cardjuice/LockInBar";
import { UltimateScreen } from "../../cardjuice/UltimateScreen";

import { ELEMENT_META } from "@/lib/wuxing/element";
import {
  typoTierForCombo,
  type TypoTier,
} from "@/lib/choreography/typography";
import type { CardDefinition, ElementId } from "@/lib/purupuru/contracts/types";

// Side-effect: CardFace requires battle-v2.css for sizing + lift transforms.
import "@/app/battle-v2/_styles/battle-v2.css";

import type { CardLabConfigT } from "../VfxConfig";

interface CardLabPreviewProps {
  readonly config: CardLabConfigT;
  readonly triggerKey: number;
}

// ── Sequence timings (operator-tunable later via knobs) ───────────────────

const DROP_DURATION_SEC = 0.2;
const BREATH_DURATION_SEC = 0.3;
const PER_CARD_DURATION_SEC = 1.2;
const PER_CARD_HIT_DELAY_SEC = 0.45;
const PER_CARD_GAP_SEC = 0.18;
const FINALE_DURATION_SEC = 2.4;
const SETTLE_DURATION_SEC = 0.4;

// ── Phase types ───────────────────────────────────────────────────────────

type SequencePhase =
  | { kind: "idle" }
  | { kind: "locked" }
  | { kind: "breath" }
  | { kind: "card"; index: number }
  | { kind: "finale" }
  | { kind: "settle" };

const HIT_TEXT_FOR_TIER: Record<TypoTier, string> = {
  "base-hit": "HIT",
  "combo-2": "2 CHAIN",
  "combo-3": "3 CHAIN",
  "combo-4": "4 CHAIN",
  "ultimate-chain": "FULL CYCLE",
  "tide-banner": "THE TIDE FAVORED WOOD",
};

export function CardLabPreview({ config, triggerKey }: CardLabPreviewProps) {
  const [phase, setPhase] = useState<SequencePhase>({ kind: "idle" });
  const [activeCard, setActiveCard] = useState<CardDefinition | null>(null);
  const [hitMoment, setHitMoment] = useState<{ tier: TypoTier; nonce: number } | null>(null);
  const [ultimateActive, setUltimateActive] = useState(false);
  const [showTide, setShowTide] = useState(false);

  // Lineup cached from HandRack via onLineupChange. Sequence reads this
  // at lock-in time and walks it card-by-card.
  const lineupRef = useRef<readonly CardDefinition[]>([]);
  const onLineupChange = useCallback((lineup: readonly CardDefinition[]) => {
    lineupRef.current = lineup;
  }, []);

  // ── Triggers ──────────────────────────────────────────────────────────
  const fireLockIn = useCallback(() => {
    if (phase.kind !== "idle") return;
    setPhase({ kind: "locked" });
  }, [phase.kind]);

  const fireUnlock = useCallback(() => {
    setPhase({ kind: "idle" });
    setActiveCard(null);
    setHitMoment(null);
    setUltimateActive(false);
    setShowTide(false);
  }, []);

  // The vfx-lab main trigger button also fires lock-in.
  useEffect(() => {
    if (triggerKey > 0 && phase.kind === "idle") {
      fireLockIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  // ── Sequence driver ──────────────────────────────────────────────────
  useEffect(() => {
    const lineup = lineupRef.current;

    if (phase.kind === "locked") {
      const id = window.setTimeout(
        () => setPhase({ kind: "breath" }),
        DROP_DURATION_SEC * 1000,
      );
      return () => window.clearTimeout(id);
    }

    if (phase.kind === "breath") {
      const id = window.setTimeout(
        () => setPhase({ kind: "card", index: 0 }),
        BREATH_DURATION_SEC * 1000,
      );
      return () => window.clearTimeout(id);
    }

    if (phase.kind === "card") {
      const card = lineup[phase.index];
      if (!card) {
        setPhase({ kind: "finale" });
        return;
      }
      setActiveCard(card);
      // Fire HIT-text mid-phase. Tier = (index + 1) → base-hit, combo-2,
      // ..., ultimate-chain. Ultimate also engages the screen takeover.
      const tier = typoTierForCombo(phase.index + 1);
      const hitTimer = window.setTimeout(() => {
        setHitMoment({ tier, nonce: Date.now() });
        if (tier === "ultimate-chain") setUltimateActive(true);
      }, PER_CARD_HIT_DELAY_SEC * 1000);

      // Advance to next card after the per-card duration + gap.
      const nextTimer = window.setTimeout(
        () => {
          if (phase.index + 1 < lineup.length) {
            setPhase({ kind: "card", index: phase.index + 1 });
          } else {
            setPhase({ kind: "finale" });
          }
        },
        (PER_CARD_DURATION_SEC + PER_CARD_GAP_SEC) * 1000,
      );

      return () => {
        window.clearTimeout(hitTimer);
        window.clearTimeout(nextTimer);
      };
    }

    if (phase.kind === "finale") {
      // Tide banner ALWAYS fires as the end-of-round signal. Per pitch:
      // "Results don't say Victory or Defeat. They say The tide favored
      // Wood today." This is the lab approximation.
      setShowTide(true);
      const id = window.setTimeout(
        () => setPhase({ kind: "settle" }),
        FINALE_DURATION_SEC * 1000,
      );
      return () => window.clearTimeout(id);
    }

    if (phase.kind === "settle") {
      const id = window.setTimeout(() => {
        setPhase({ kind: "idle" });
        setActiveCard(null);
        setHitMoment(null);
        setUltimateActive(false);
        setShowTide(false);
      }, SETTLE_DURATION_SEC * 1000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [phase]);

  const handLocked = phase.kind !== "idle";

  const ultimateAccent = useMemo(() => {
    if (!activeCard) return "#e8a040";
    return ELEMENT_META[activeCard.elementId as ElementId]?.canonicalHue ?? "#e8a040";
  }, [activeCard]);

  const showcaseVisible =
    phase.kind === "card" || phase.kind === "finale";

  const phaseLabel = (() => {
    if (phase.kind === "idle") return null;
    if (phase.kind === "card") return `card ${phase.index + 1} of ${lineupRef.current.length}`;
    return phase.kind;
  })();

  return (
    <>
      <group />

      <LabPortal>
        <HandRack
          locked={handLocked}
          onLineupChange={onLineupChange}
          config={{
            hoverLiftPx: config.hoverLiftPx,
            hoverScaleMul: config.hoverScaleMul,
            hoverDurationSec: config.hoverDurationSec,
            keybindFlashDurationSec: config.keybindFlashDurationSec,
            keybindFlashOpacity: config.keybindFlashOpacity,
            discardDurationSec: config.discardDurationSec,
            replacementDurationSec: config.replacementDurationSec,
            replacementOvershoot: config.replacementOvershoot,
            cardGapPx: config.cardGapPx,
            cardWidthPx: config.cardWidthPx,
            cardHeightPx: config.cardHeightPx,
            bottomPx: config.bottomPx,
          }}
        />

        <LockInBar
          locked={phase.kind !== "idle"}
          playing={phase.kind === "card" || phase.kind === "finale" || phase.kind === "settle"}
          onLockIn={fireLockIn}
          onUnlock={fireUnlock}
          bottomPx={config.bottomPx + config.cardHeightPx + 30}
        />

        <CardShowcase card={activeCard} visible={showcaseVisible} />

        <UltimateScreen
          active={ultimateActive}
          accentHex={ultimateAccent}
          onDone={() => setUltimateActive(false)}
        />

        {/* Per-card HIT text */}
        {hitMoment && (
          <HitText
            key={hitMoment.nonce}
            tier={hitMoment.tier}
            text={HIT_TEXT_FOR_TIER[hitMoment.tier]}
            onSettle={() => setHitMoment(null)}
            anchorY={0.42}
          />
        )}

        {/* End-of-round tide banner */}
        {showTide && (
          <HitText
            key={`tide-${phase.kind}`}
            tier="tide-banner"
            text="THE TIDE FAVORED WOOD"
            onSettle={() => setShowTide(false)}
            anchorY={0.5}
          />
        )}

        <TypographyPreview />

        {/* Phase / chain badge */}
        {phaseLabel && (
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: "50%",
              top: 24,
              transform: "translateX(-50%)",
              padding: "6px 14px",
              background: "rgba(20,14,8,0.85)",
              border: "1px solid rgba(225,173,61,0.35)",
              borderRadius: 999,
              fontFamily: "var(--font-puru-mono, monospace)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--puru-honey-base, #e1ad3d)",
              zIndex: 32,
              pointerEvents: "none",
              display: "flex",
              gap: 14,
              whiteSpace: "nowrap",
            }}
          >
            <span>phase · {phaseLabel}</span>
          </div>
        )}

        {/* Keybind hint strip */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: 24,
            bottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontFamily: "var(--font-puru-mono, monospace)",
            fontSize: 9,
            color: "rgba(200,160,100,0.55)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            pointerEvents: "none",
            zIndex: 11,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <span><kbd>1-5</kbd> arm</span>
            <span><kbd>d</kbd> discard</span>
            <span><kbd>r</kbd> reroll</span>
            <span><kbd>shift+1-5</kbd> discard slot</span>
          </div>
          <div style={{ display: "flex", gap: 12, opacity: 0.85 }}>
            <span><kbd>←</kbd> <kbd>→</kbd> swap armed slot</span>
            <span style={{ opacity: 0.65 }}>drag any card to reorder</span>
          </div>
          <div style={{ display: "flex", gap: 12, opacity: 0.85 }}>
            <span><kbd>enter</kbd> lock in · plays full lineup</span>
            <span><kbd>esc</kbd> unlock</span>
          </div>
          <div style={{ display: "flex", gap: 12, opacity: 0.65 }}>
            <span><kbd>6-0</kbd> demo tiers</span>
            <span><kbd>-</kbd> tide banner</span>
          </div>
        </div>
      </LabPortal>
    </>
  );
}

export { HAND_RACK_DEFAULTS };
