"use client";

/**
 * EntryScreen — 1:1 port of world-purupuru EntryScreen.svelte (Session 78).
 * Weather orb · wordmark · play button. CSS lives in app/battle/_styles/EntryScreen.css.
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { WORLD_MAP_TEXTURE } from "@/lib/cdn";
import { type CompanionState, loadCompanion } from "@/lib/honeycomb/companion";
import { type DailyMeta, getDailyMeta, getDailyShift } from "@/lib/honeycomb/daily-meta";
import { ELEMENT_META, ELEMENT_ORDER, type Element } from "@/lib/honeycomb/wuxing";
import { matchCommand } from "@/lib/runtime/match.client";

interface EntryScreenProps {
  readonly weather: Element;
  readonly quizElement: Element | null;
  readonly challengeVs?: Element | null;
  readonly challengeScore?: { wins: number; losses: number } | null;
  readonly challengeFrom?: Element | null;
  readonly seed: string;
}

export function EntryScreen({
  weather,
  quizElement,
  challengeVs = null,
  challengeScore = null,
  challengeFrom = null,
  seed,
}: EntryScreenProps) {
  const onPlay = () => matchCommand.beginMatch();

  // Companion + daily meta only resolve on the client (localStorage + Date)
  // so we hydrate them in an effect to avoid SSR mismatch.
  const [meta, setMeta] = useState<DailyMeta | null>(null);
  const [shiftedOvernight, setShiftedOvernight] = useState(false);
  const [companion, setCompanion] = useState<CompanionState | null>(null);
  useEffect(() => {
    setMeta(getDailyMeta());
    setShiftedOvernight(getDailyShift().any);
    setCompanion(loadCompanion());
  }, []);

  const btnGlow = quizElement
    ? `var(--puru-${quizElement}-vivid)`
    : "var(--puru-honey-base)";

  return (
    <div className="entry" data-element={quizElement ?? undefined}>
      {/* Operator wants the map presence on the lock screen too — same
          centered ghost-texture treatment as the arena's .map-flat,
          but without the territory overlays. Sits at z:0 behind all
          entry-screen UI. */}
      <img
        className="entry-map"
        src={WORLD_MAP_TEXTURE}
        alt=""
        aria-hidden
      />

      <div className="weather-orb" data-element={weather}>
        <span className="orb-kanji">{ELEMENT_META[weather].kanji}</span>
      </div>

      {challengeVs ? (
        <div className="challenge-banner" data-element={challengeVs}>
          <span className="challenge-kanji">{ELEMENT_META[challengeVs].kanji}</span>
          <span className="challenge-label">
            Beat {ELEMENT_META[challengeVs].name}
            {challengeScore ? ` ${challengeScore.wins}-${challengeScore.losses}` : ""}
          </span>
          {challengeFrom && (
            <span className="challenge-from">
              {ELEMENT_META[challengeFrom].kanji} challenged you
            </span>
          )}
        </div>
      ) : (
        <div className="entry-title-block">
          <div className="entry-wordmark">
            <Image
              src="/brand/purupuru-wordmark.svg"
              alt="Purupuru"
              width={240}
              height={90}
              priority
              className="wordmark-svg"
              style={{ width: "240px", height: "auto" }}
            />
          </div>
          <span className="entry-subtitle">the game</span>
        </div>
      )}

      {/* Today's tide — daily meta strip. Hydrated client-side. */}
      {meta && (
        <div
          className="entry-tide"
          data-shifted={shiftedOvernight ? "" : undefined}
          aria-live="polite"
        >
          <span className="entry-tide-label">
            {shiftedOvernight ? "the tide turned overnight" : "today's tide"}
          </span>
          <span className="entry-tide-meta">{meta.label}</span>
        </div>
      )}

      {/* Returning-player identity — companion deepest element + record. */}
      {companion && companion.totalMatches > 0 && companion.deepestElement && (
        <p className="entry-companion">
          {ELEMENT_META[companion.deepestElement].caretaker} has been with you for{" "}
          {companion.totalMatches} {companion.totalMatches === 1 ? "battle" : "battles"}.
        </p>
      )}

      <div className="entry-actions">
        <button
          type="button"
          className={`tile-btn ${quizElement ? "tile-btn-element" : ""}`}
          data-element={quizElement ?? undefined}
          style={{ "--btn-glow": btnGlow } as React.CSSProperties}
          onClick={onPlay}
        >
          {challengeVs ? "Accept challenge" : "Play"}
        </button>

        {/* Wuxing status strip — five kanji in Shēng order; the
            element matching today's `weather` reads as the operative
            status indicator (audit-feel verdict 2026-05-12: promote
            from ambient → operative). The other four still breathe. */}
        <div
          className="entry-wuxing-strip"
          data-weather={weather}
          aria-hidden
        >
          {ELEMENT_ORDER.map((el, i) => (
            <span
              key={el}
              className="entry-wuxing-glyph"
              data-element={el}
              style={{ animationDelay: `${i * 0.8}s` } as React.CSSProperties}
            >
              {ELEMENT_META[el].kanji}
            </span>
          ))}
        </div>
      </div>

      <p className="entry-seed" aria-label={`Seed ${seed}`}>
        <span className="entry-seed-label">seed</span>
        <span className="entry-seed-code">{seed.slice(0, 8)}</span>
      </p>
    </div>
  );
}
