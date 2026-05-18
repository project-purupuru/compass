"use client";

/**
 * CdnImage — resilient image loader with fallback chain.
 *
 * Pass an ordered list of candidate URLs. The component renders the first
 * one; on `onError`, advances to the next. If the whole chain fails, shows
 * a transparent placeholder so the layout doesn't collapse.
 *
 * Used by BattleHand · OpponentZone · CardPetal · anywhere the CDN bucket
 * might be missing a specific permutation (e.g. jani-trading-card-earth
 * was 403 as of 2026-05-12).
 */

import { useEffect, useRef, useState } from "react";

interface CdnImageProps {
  readonly sources: readonly string[];
  readonly alt: string;
  readonly className?: string;
  readonly draggable?: boolean;
  readonly loading?: "eager" | "lazy";
  readonly onLoadSuccess?: (src: string) => void;
}

export function CdnImage({
  sources,
  alt,
  className,
  draggable = false,
  loading = "lazy",
  onLoadSuccess,
}: CdnImageProps) {
  const [idx, setIdx] = useState(0);
  const seenRef = useRef<string | null>(null);

  // Reset when the source list changes identity (e.g. card swap)
  useEffect(() => {
    setIdx(0);
    seenRef.current = null;
  }, [sources]);

  const current = sources[idx];

  if (!current) {
    return (
      <span
        aria-label={alt}
        className={className}
        style={{ background: "transparent", display: "block" }}
      />
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      draggable={draggable}
      loading={loading}
      onLoad={() => {
        if (seenRef.current === current) return;
        seenRef.current = current;
        onLoadSuccess?.(current);
      }}
      onError={() => {
        if (idx < sources.length - 1) setIdx(idx + 1);
      }}
    />
  );
}
