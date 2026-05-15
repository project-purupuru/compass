/**
 * RewardRead — the result. The substrate's truth, read back.
 *
 * Per build doc step 7. Beat: `reward_preview`. Mount: `ui.reward_preview`.
 *
 * Consumes the `RewardGranted` semantic event the resolver emitted and shows
 * it when the `reward_preview` beat fires. The quantity is monospace +
 * tabular-nums — it ticks into place, it does not fade. The result is the
 * payoff the repeat-test hinges on: the player should *see* what they earned.
 *
 * Exit contract:
 *   - starts on:    the `reward_preview` beat
 *   - owned by:     this component
 *   - interrupted by: the `unlock_input` beat (begins the leave) — and a
 *     fallback timer, so it can never deadlock open
 *   - fails soft:   if no reward has been granted, nothing reads
 */

"use client";

import { useEffect, useRef, useState } from "react";

import type { SemanticEvent } from "@/lib/purupuru/contracts/types";
import type { BeatFireRecord } from "@/lib/purupuru/presentation/sequencer";

type RewardGrantedEvent = Extract<SemanticEvent, { type: "RewardGranted" }>;

const FALLBACK_DISMISS_MS = 2200;
const LEAVE_MS = 320;

interface RewardReadProps {
  readonly activeBeat: BeatFireRecord | null;
  readonly reward: RewardGrantedEvent | null;
}

export function RewardRead({ activeBeat, reward }: RewardReadProps) {
  const [shown, setShown] = useState<RewardGrantedEvent | null>(null);
  const [leaving, setLeaving] = useState(false);
  const fallbackRef = useRef<number | null>(null);
  const leaveRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (fallbackRef.current !== null) window.clearTimeout(fallbackRef.current);
    if (leaveRef.current !== null) window.clearTimeout(leaveRef.current);
    fallbackRef.current = null;
    leaveRef.current = null;
  };

  const beginLeave = () => {
    setLeaving(true);
    leaveRef.current = window.setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, LEAVE_MS);
  };

  useEffect(() => {
    if (!activeBeat) return;

    if (activeBeat.beatId === "reward_preview" && reward) {
      clearTimers();
      setShown(reward);
      setLeaving(false);
      // Fallback dismiss — RewardRead can never deadlock open even if the
      // unlock beat is missed.
      fallbackRef.current = window.setTimeout(beginLeave, FALLBACK_DISMISS_MS);
      return;
    }

    if (activeBeat.beatId === "unlock_input") {
      clearTimers();
      // Begin the leave unconditionally — if nothing is shown, setLeaving +
      // the deferred setShown(null) are harmless no-ops.
      beginLeave();
    }
    // `reward` is captured intentionally only when the beat fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBeat]);

  useEffect(() => clearTimers, []);

  if (!shown) return null;

  return (
    <div
      className={`reward-read${leaving ? " reward-read--leaving" : ""}`}
      role="status"
    >
      <span className="reward-read__label">{shown.rewardType.replace(/_/g, " ")}</span>
      <span className="reward-read__value">
        <span className="reward-read__qty">+{shown.quantity}</span>
        <span className="reward-read__id">{shown.id.replace(/_/g, " ")}</span>
      </span>
    </div>
  );
}
