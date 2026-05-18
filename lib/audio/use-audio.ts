"use client";

/**
 * useAudio — React hook for the AudioEngine.
 *
 * Mounts the audio engine + registers sounds + installs an unlock-on-
 * first-gesture listener. Component callers just call audio.play("id")
 * via the returned helpers.
 *
 * Music subscription is coupled to MatchEvent via useMatchEvent so phase
 * transitions automatically crossfade the soundtrack.
 */

import { useCallback, useEffect, useRef } from "react";
import type { MatchEvent } from "@/lib/honeycomb/match.port";
import { useMatchEvent } from "@/lib/runtime/match.client";
import { audioEngine, type PlayOptions } from "./engine";
import { musicDirector } from "./music-director";
import { ensureRegistered } from "./registry";

export function useAudio() {
  const installedRef = useRef(false);

  // One-time setup — register sounds + unlock on first gesture.
  useEffect(() => {
    if (installedRef.current) return;
    installedRef.current = true;
    ensureRegistered();
    const unlock = () => {
      audioEngine().unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Music director — subscribes to phase-entered events from the match.
  const onMatchEvent = useCallback((event: MatchEvent) => {
    if (event._tag === "phase-entered") {
      musicDirector().onPhase(event.phase);
    }
    if (event._tag === "match-completed") {
      const winId = event.winner === "p1" ? "match.win" : event.winner === "p2" ? "match.lose" : "match.draw";
      audioEngine().play(winId);
    }
    if (event._tag === "lineups-locked") {
      audioEngine().play("match.lock-in");
    }
    if (event._tag === "combo-discovered" && event.isFirstTime) {
      audioEngine().play("discovery.combo");
    }
  }, []);
  const matchEventPredicate = useCallback(() => true, []);
  useMatchEvent(matchEventPredicate, onMatchEvent);

  // Public callers. Stable references for use in onClick handlers.
  return {
    play: useCallback((id: string, options?: PlayOptions) => audioEngine().play(id, options), []),
    playClashImpact: useCallback(
      (element: string) => audioEngine().play(`match.clash-impact.${element}`),
      [],
    ),
    setEnabled: useCallback((on: boolean) => audioEngine().setEnabled(on), []),
    isEnabled: useCallback(() => audioEngine().isEnabled(), []),
  };
}
