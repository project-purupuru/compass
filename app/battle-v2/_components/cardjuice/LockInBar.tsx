/**
 * LockInBar — the commit button that hands control from the player to
 * the choreographed playback sequence.
 *
 * Per Gemini's STARDUST breakdown (2026-05-17) — the lock-in transition:
 *   - 0.00s: Player presses LOCK IN.
 *   - 0.00–0.20s: Bottom card UI Y-translates +150px in easeInCubic.
 *     Physical exit, not fade — the hand LEAVES the screen.
 *   - 0.20–0.50s: THE BREATH. 0.3s pause. No animation. Tells the player
 *     "the simulation is now running." This is the emotional palette
 *     cleanser between "thinking" phase and "watching" phase.
 *   - 0.50s onward: Stage D's single-card playback fires.
 *
 * This component renders the BUTTON; the HandRack consumes the `locked`
 * prop to actually drop. The button itself also exits when locked
 * (rises with the hand and fades) so the player doesn't keep seeing
 * "LOCK IN" while the playback runs.
 *
 * Keybind: `Enter` or `space` to lock in. `Escape` to unlock (lab-only
 * convenience — in-game the lock is committed).
 */

"use client";

import { useEffect } from "react";

export interface LockInBarProps {
  readonly locked: boolean;
  readonly playing: boolean;
  readonly onLockIn: () => void;
  readonly onUnlock?: () => void;
  /** Distance above the hand rack in pixels. */
  readonly bottomPx?: number;
}

export function LockInBar({
  locked,
  playing,
  onLockIn,
  onUnlock,
  bottomPx = 240,
}: LockInBarProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter" || e.key === " ") {
        if (!locked && !playing) {
          e.preventDefault();
          onLockIn();
        }
      }
      if (e.key === "Escape") {
        if (locked && onUnlock) {
          e.preventDefault();
          onUnlock();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, playing, onLockIn, onUnlock]);

  // While locked-or-playing, the button itself slides off-screen with the
  // hand. The hand drop is 150px (per Gemini); button uses the same
  // easeInCubic curve at the same duration so they leave together.
  const buttonExited = locked || playing;
  const translateY = buttonExited ? 150 : 0;
  const opacity = buttonExited ? 0 : 1;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: bottomPx,
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity,
        transition:
          "transform 0.2s cubic-bezier(0.32, 0, 0.67, 0), opacity 0.2s cubic-bezier(0.32, 0, 0.67, 0)",
        zIndex: 12,
        pointerEvents: buttonExited ? "none" : "auto",
      }}
    >
      <button
        type="button"
        onClick={onLockIn}
        disabled={buttonExited}
        style={{
          padding: "12px 32px",
          fontFamily: "var(--font-puru-mono, monospace)",
          fontSize: 12,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          background: "var(--puru-honey-base, #e1ad3d)",
          color: "oklch(0.15 0.04 80)",
          border: "1px solid var(--puru-honey-base, #e1ad3d)",
          borderRadius: "var(--radius-md, 12px)",
          cursor: buttonExited ? "default" : "pointer",
          boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
          fontWeight: 700,
        }}
      >
        lock in ▶
      </button>
      <div
        aria-hidden
        style={{
          marginTop: 6,
          fontSize: 9,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(200,160,100,0.55)",
          textAlign: "center",
          fontFamily: "var(--font-puru-mono, monospace)",
        }}
      >
        [enter]
      </div>
    </div>
  );
}

/**
 * Hook: drives the lock-in → breath → playing → idle state machine.
 * Returns the current phase + a fire function for the LockInBar to call.
 *
 * Phases:
 *   - "idle"     — player is arranging hand
 *   - "locked"   — 0.2s UI-drop animation in progress
 *   - "breath"   — 0.3s palette cleanser
 *   - "playing"  — Stage D playback would run here. For Stage C MVP we
 *                  hold this state for `playbackDurationSec` then return
 *                  to idle. Wire to real orchestrator in Stage D.
 *   - "settle"   — short return-to-hand cleanup
 */
export type LockPhase = "idle" | "locked" | "breath" | "playing" | "settle";

export interface UseLockInOpts {
  /** UI-drop duration. Default 0.2s. */
  readonly dropDurationSec?: number;
  /** Breath pause duration. Default 0.3s. */
  readonly breathSec?: number;
  /** Playback hold (placeholder for Stage D's actual sequence). Default 2.5s. */
  readonly playbackDurationSec?: number;
}
