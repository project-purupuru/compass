"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, Bell, BellSlash } from "@phosphor-icons/react";
import { CELESTIAL } from "@/lib/world-purupuru-cdn";

// Two-track ambient soundtrack. Each track gets a celestial album-art
// icon — sun for "skyeyes" (sky/day), moon for "dewlight" (dew/night) —
// pulled from the same CDN that the asset-test page uses, so swaps come
// straight out of the visual library with zero local copies.
type Track = {
  /** Public URL of the MP3 (lives under /public/music). */
  src: string;
  /** Track name as shown in the player. */
  title: string;
  /** Album-art image URL (CDN). */
  art: string;
};

const TRACKS: Track[] = [
  { src: "/music/cassette-skyeyes.mp3", title: "skyeyes", art: CELESTIAL.sun },
  { src: "/music/cassette-dewlight.mp3", title: "dewlight", art: CELESTIAL.moon },
];

export function MusicPlayer({
  playing,
  onPlayingChange,
  sfxEnabled,
  onSfxToggle,
  isNight,
}: {
  /** True while audio should be playing (controlled by parent so the
   * pentatonic sonifier can subscribe to the same play-state). */
  playing: boolean;
  onPlayingChange: (next: boolean) => void;
  /** Independent toggle for the per-event chimes. When false, music
   * plays without sfx. */
  sfxEnabled: boolean;
  onSfxToggle: () => void;
  /** Local night-state from the weather adapter. When defined, drives
   * the active track on transitions (sunset → dewlight, sunrise →
   * skyeyes). Manual skip still works between transitions. */
  isNight?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1

  // Auto-flip the active track on actual is_night transitions. Effect
  // only re-runs when is_night changes, so a manual skip mid-day is
  // not stomped by every weather refresh — only by the next sunset.
  useEffect(() => {
    if (isNight === undefined) return;
    setTrackIdx(isNight ? 1 : 0);
  }, [isNight]);

  const track = TRACKS[trackIdx];

  // Wire the audio element's events to local state. The `playing` prop
  // is the source of truth; effects below sync the element to it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.55;
    const onTime = () => {
      setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    };
    const onEnded = () => {
      // Auto-advance to the other track when one ends. Keeps the
      // ambient stream going without forcing the user back to the UI.
      setTrackIdx((i) => (i + 1) % TRACKS.length);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Sync element state to the controlled `playing` prop. Browser autoplay
  // rules are satisfied because the prop only flips inside a user-gesture
  // click handler upstream.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => {
        // Play rejection (rare after user gesture) — surface back to the
        // parent so the sonifier doesn't think we're playing.
        onPlayingChange(false);
      });
    } else {
      audio.pause();
    }
  }, [playing, onPlayingChange]);

  // On track swap, reset progress and continue playback if we were
  // already playing (cassette flip metaphor — same gesture, new side).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
    if (playing) {
      audio.play().catch(() => onPlayingChange(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx]);

  const togglePlay = () => onPlayingChange(!playing);
  const nextTrack = () => setTrackIdx((i) => (i + 1) % TRACKS.length);

  const pct = Math.round(progress * 100);

  return (
    <section
      className="absolute bottom-4 left-4 z-10 hidden w-[340px] overflow-hidden rounded-puru-md border border-puru-surface-border bg-puru-cloud-bright/90 shadow-puru-tile-hover backdrop-blur-md md:block"
      aria-label="ambient soundtrack"
    >
      <audio ref={audioRef} src={track.src} preload="metadata" aria-hidden />

      <div className="flex items-center gap-2.5 px-2.5 py-2">
        {/* Album art — celestial icon for the active track. The CDN
            <img> tag mirrors the asset-test page; no Next image config
            needed. The breathing animation only runs while playing so
            paused state reads visually still. */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-puru-sm bg-puru-cloud-base p-1.5 shadow-puru-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.art}
            alt={`${track.title} album art`}
            className="h-full w-full object-contain"
            style={{
              animation: playing ? "breathe 5.5s var(--ease-puru-breathe) infinite" : undefined,
            }}
          />
        </div>

        {/* Title column — KpiCell-style label/value: tiny mono eyebrow
            + primary value, matching the WeatherTile vocab. min-w-0 +
            truncate keep long titles from pushing the controls off the
            right edge. */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-soft">
            track
          </span>
          <span className="truncate font-puru-mono text-sm capitalize leading-none text-puru-ink-rich">
            {track.title}
          </span>
        </div>

        {/* Controls — play/pause is the prominent action; skip is a
            quieter secondary. All three share an ink/cloud hover
            treatment (lift to cloud-bright + darker border + sharpened
            ink) so the music player reads in the same neutral register
            as the rest of the UI chrome. */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "pause soundtrack" : "play soundtrack"}
            aria-pressed={playing}
            className="flex h-7 w-7 items-center justify-center rounded-puru-sm border border-puru-surface-border bg-puru-cloud-base text-puru-ink-rich transition-colors hover:border-puru-ink-soft hover:bg-puru-cloud-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-puru-ink-soft"
          >
            {playing ? (
              <Pause weight="fill" size={12} />
            ) : (
              <Play weight="fill" size={12} className="translate-x-[1px]" />
            )}
          </button>
          <button
            type="button"
            onClick={nextTrack}
            aria-label="next track"
            className="flex h-7 w-7 items-center justify-center rounded-puru-sm border border-puru-surface-border bg-puru-cloud-base text-puru-ink-soft transition-colors hover:border-puru-ink-soft hover:bg-puru-cloud-bright hover:text-puru-ink-rich focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-puru-ink-soft"
          >
            <SkipForward weight="fill" size={11} />
          </button>
          <button
            type="button"
            onClick={onSfxToggle}
            aria-label={sfxEnabled ? "mute sfx chimes" : "enable sfx chimes"}
            aria-pressed={sfxEnabled}
            title={sfxEnabled ? "sfx on" : "sfx muted"}
            className={`flex h-7 w-7 items-center justify-center rounded-puru-sm border border-puru-surface-border bg-puru-cloud-base transition-colors hover:border-puru-ink-soft hover:bg-puru-cloud-bright hover:text-puru-ink-rich focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-puru-ink-soft ${
              sfxEnabled ? "text-puru-ink-soft" : "text-puru-ink-dim"
            }`}
          >
            {sfxEnabled ? <Bell weight="fill" size={11} /> : <BellSlash weight="fill" size={11} />}
          </button>
        </div>
      </div>

      {/* Progress hairline. Width animates from the timeupdate effect;
          the bar's existence at all is the live-playback signal — no
          extra "● live" badge needed. */}
      <div
        className="h-[2px] w-full overflow-hidden bg-puru-cloud-deep"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${track.title} playback progress`}
      >
        <div
          className="h-full bg-puru-fire-vivid transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}
