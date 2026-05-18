"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { type Element } from "@/lib/score";
import { ELEMENT_KANJI } from "@/lib/domain/element";
import { populationStore } from "@/lib/sim/population.system";
import type { PuruhaniIdentity } from "@/lib/sim/types";
import { timeAgo } from "@/lib/time/format";
import { PuruhaniAvatar } from "./PuruhaniAvatar";

/**
 * Focus card — slide-in panel summarising a clicked puruhani.
 *
 * Aligned with v0 product surface (2026-05-10): the only thing a player
 * can do today is claim their genesis stone, which slots them into one
 * of five element teams. So the card shows identity (name / twitter /
 * solana), the team they joined, their inventory (the stone they
 * minted), and recent activity — nothing speculative beyond that.
 *
 * Source of truth: populationStore. The canvas tints sprites by the
 * store's per-actor `primaryElement`; we read the same field here so
 * the focus card's element / inventory / kanji match the sprite the
 * user clicked. (Previously read from scoreAdapter which uses an
 * independent address hash, producing wrong-element mismatches.)
 */

const STONE_NAME: Record<Element, string> = {
  wood: "Wood Stone",
  fire: "Fire Stone",
  earth: "Earth Stone",
  water: "Water Stone",
  metal: "Metal Stone",
};

function shortAddress(addr: string): string {
  // Solana base58 convention — 4…4 (Phantom-style).
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// "Earth" takes "an"; the other four elements start with consonant sounds.
const indefiniteArticle = (el: Element): string => (el === "earth" ? "an" : "a");

interface PopEntry {
  primaryElement: Element;
  joinedAt: string;
}

function lookup(trader: string): PopEntry | null {
  const found = populationStore.current().find((p) => p.trader === trader);
  if (!found) return null;
  return { primaryElement: found.primaryElement, joinedAt: found.joinedAt };
}

export function FocusCard({
  identity,
  onClose,
  wrapperRef: externalRef,
}: {
  identity: PuruhaniIdentity | null;
  onClose: () => void;
  wrapperRef?: RefObject<HTMLElement | null>;
}) {
  const localRef = useRef<HTMLElement>(null);
  const wrapperRef = externalRef ?? localRef;
  const [entry, setEntry] = useState<PopEntry | null>(null);
  const [now, setNow] = useState<number>(0);
  const [stickyIdentity, setStickyIdentity] = useState<PuruhaniIdentity | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (identity) setStickyIdentity(identity);
  }, [identity]);

  useEffect(() => {
    if (!identity) return;
    setEntry(lookup(identity.trader));
  }, [identity]);

  useEffect(() => {
    if (!identity) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [identity, onClose]);

  const isOpen = identity !== null;
  const id = identity ?? stickyIdentity;
  if (!id) return null;

  const primary: Element = entry?.primaryElement ?? "wood";
  const mintedAt = entry?.joinedAt;

  return (
    <aside
      ref={wrapperRef}
      role="dialog"
      aria-label="puruhani details"
      aria-hidden={!isOpen}
      className="absolute left-4 bottom-4 z-20 w-[340px] md:bottom-[82px]"
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(-110%)",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transition: "transform 360ms cubic-bezier(.32,.72,.24,1), opacity 240ms ease-out",
      }}
    >
      <div className="overflow-hidden rounded-puru-md border border-puru-surface-border bg-puru-cloud-bright/95 shadow-puru-tile-hover backdrop-blur-md">
        <header
          className="flex items-start gap-3 border-b border-puru-surface-border px-4 py-3"
          style={{
            backgroundImage: `linear-gradient(to left, color-mix(in oklch, var(--puru-${primary}-vivid) 14%, transparent) 0%, transparent 60%)`,
          }}
        >
          <PuruhaniAvatar seed={id.pfp} primary={primary} size={56} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-puru-display text-lg leading-tight text-puru-ink-rich">
              {id.displayName}
            </h3>
            <p className="truncate font-puru-mono text-xs text-puru-ink-soft">@{id.username}</p>
            <p
              className="mt-0.5 truncate font-puru-mono text-2xs text-puru-ink-dim"
              title={id.trader}
            >
              {shortAddress(id.trader)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="shrink-0 rounded-puru-sm p-1 font-puru-mono text-sm text-puru-ink-dim transition-colors hover:bg-puru-cloud-base hover:text-puru-ink-rich"
          >
            ✕
          </button>
        </header>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-soft">
            element
          </span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="font-puru-card text-2xl leading-none"
              style={{ color: `var(--puru-${primary}-vivid)` }}
            >
              {ELEMENT_KANJI[primary]}
            </span>
            <span className="font-puru-mono text-sm capitalize text-puru-ink-rich">{primary}</span>
          </span>
        </div>

        <Inventory primary={primary} mintedAt={mintedAt} now={now} />

        <div className="border-t border-puru-cloud-dim/60 px-4 py-3">
          <h4 className="mb-2 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-soft">
            recent activity
          </h4>
          {mintedAt ? (
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-2 font-puru-mono text-xs">
                <span className="truncate text-puru-ink-rich">
                  Claimed {indefiniteArticle(primary)} {STONE_NAME[primary]}
                </span>
                <span className="ml-auto whitespace-nowrap font-puru-mono text-2xs uppercase tracking-[0.18em] text-puru-ink-dim">
                  {now ? timeAgo(mintedAt, now) : ""}
                </span>
              </li>
            </ul>
          ) : (
            <p className="font-puru-mono text-xs text-puru-ink-dim">no recent activity</p>
          )}
        </div>
      </div>
    </aside>
  );
}

function Inventory({
  primary,
  mintedAt,
  now,
}: {
  primary: Element;
  mintedAt?: string;
  now: number;
}) {
  return (
    <div className="border-t border-puru-cloud-dim/60 px-4 py-3">
      <h4 className="mb-2 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-soft">
        inventory
      </h4>
      <div className="grid grid-cols-4 gap-2">
        <StoneTile element={primary} mintedAt={mintedAt} now={now} />
        <EmptySlot />
        <EmptySlot />
        <EmptySlot />
      </div>
    </div>
  );
}

function StoneTile({
  element,
  mintedAt,
  now,
}: {
  element: Element;
  mintedAt?: string;
  now: number;
}) {
  return (
    <div
      className="relative aspect-square overflow-hidden rounded-puru-sm border border-puru-surface-border"
      style={{
        backgroundColor: `color-mix(in oklch, var(--puru-${element}-vivid) 6%, var(--puru-cloud-bright))`,
      }}
      title={
        mintedAt && now
          ? `${STONE_NAME[element]} · claimed ${timeAgo(mintedAt, now)}`
          : STONE_NAME[element]
      }
    >
      <Image
        src={`/art/stones/${element}.png`}
        alt={STONE_NAME[element]}
        fill
        sizes="80px"
        className="object-cover"
      />
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      className="flex aspect-square items-center justify-center rounded-puru-sm border border-dashed border-puru-surface-border bg-puru-cloud-base/40 font-puru-mono text-base text-puru-ink-dim"
      aria-hidden
    >
      ·
    </div>
  );
}
