/**
 * MusicDirector — maps MatchPhase + MatchEvent → music track.
 *
 * Subscribes to the match event stream. When the phase changes, picks the
 * right music track and crossfades. Standalone module (no React) so it
 * can be tested + reused (e.g. preview mode in the dev panel).
 *
 * Phase → track mapping:
 *   idle / entry / quiz       → music.entry-ambient
 *   select / arrange / between-rounds → music.arrange-tension
 *   committed / clashing / disintegrating → music.clash
 *   result                    → music.result
 *
 * Music tracks are file-backed; the engine no-ops gracefully if MP3s
 * aren't there yet, so this director ships without breaking anything.
 */

import { audioEngine } from "./engine";
import type { MatchPhase } from "@/lib/honeycomb/match.port";

const PHASE_TO_TRACK: Record<MatchPhase, string> = {
  idle: "music.entry-ambient",
  entry: "music.entry-ambient",
  quiz: "music.entry-ambient",
  select: "music.arrange-tension",
  arrange: "music.arrange-tension",
  "between-rounds": "music.arrange-tension",
  committed: "music.clash",
  clashing: "music.clash",
  disintegrating: "music.clash",
  result: "music.result",
};

const FADE_MS = 1200;

class MusicDirector {
  private currentTrack: string | null = null;

  onPhase(phase: MatchPhase): void {
    const track = PHASE_TO_TRACK[phase];
    if (track === this.currentTrack) return;
    this.currentTrack = track;
    audioEngine().playMusic(track, { fadeInMs: FADE_MS, fadeOutMs: FADE_MS });
  }

  /** Drop the current music with a fade-out (e.g. on unmount). */
  silence(): void {
    audioEngine().stopMusic(FADE_MS);
    this.currentTrack = null;
  }

  getCurrentTrack(): string | null {
    return this.currentTrack;
  }
}

let _instance: MusicDirector | null = null;

export function musicDirector(): MusicDirector {
  if (!_instance) _instance = new MusicDirector();
  return _instance;
}
