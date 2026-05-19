"use client";

/**
 * CardComposition — the kitchen primitive (Session 2026-05-18).
 *
 * Renders a codex-authored card two ways side-by-side:
 *   1. AUTHORED  — live layer stack via <CodexCardFace> (the SAME component
 *      battle's CardFace dispatches to). This is the kitchen eating its own
 *      cooking: the kitchen view IS the consumer chain's first link.
 *   2. COMPOSITE — Gumi's baked composite.webp (reference)
 *
 * Status footer surfaces the pipeline: pantry size · gameplay coverage gap ·
 * consumer chain (CardFace serves card-lab, CardShowcase, HandRack, battle).
 *
 * R3F escape: PreviewPane wraps Preview children in <Canvas>. We return
 * <group /> for the r3f reconciler and mount the real UI through LabPortal.
 */

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { CodexCardFace } from "../../cards/CodexCardFace";
import { LabPortal } from "../../cardjuice/LabPortal";
import {
  getCompositeUrl,
  listCodexCards,
} from "@/lib/cards/codex/CodexCardsPort";
import type { CodexCardIndexEntryT } from "@/lib/cards/codex/layers.schema";
import type { PreviewProps } from "../VfxRegistry";
import type { CardCompositionConfigT } from "../VfxConfig";

const CANVAS_W = 733;

// The kitchen UI escapes the r3f reconciler via LabPortal, then re-anchors
// inside the DockShell's center region so it tracks the resizable rails
// instead of guessing viewport-relative pixel offsets. `position: absolute;
// inset: 0` fills the host (the center slot's wrapper is `relative` and
// `overflow-hidden` — see DockShell.tsx).
const PORTAL_CONTAINER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #1a1410 0%, #0e0a08 100%)",
  padding: 32,
  overflow: "auto",
  pointerEvents: "auto",
};

const PANEL_LABEL_STYLE: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 12,
  opacity: 0.7,
  color: "#fde0bc",
  textAlign: "center",
};

const STATUS_STYLE: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 10,
  opacity: 0.75,
  color: "#fde0bc",
  marginTop: 24,
  maxWidth: 920,
  textAlign: "left",
};

export function CardCompositionPreview({
  config,
}: PreviewProps<CardCompositionConfigT>) {
  const [cards, setCards] = useState<CodexCardIndexEntryT[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listCodexCards()
      .then(setCards)
      .catch((e) => setErr(`pantry index: ${String(e)}`));
  }, []);

  const showBoth = config.showComposite;
  const indexed = cards.find((c) => c.slug === config.cardSlug);
  const width = CANVAS_W * config.previewScale;

  return (
    <>
      {/* No-op for the r3f reconciler — the real UI is portaled below. */}
      <group />
      <LabPortal targetSelector='[data-dock-region-host="center"]'>
        <div style={PORTAL_CONTAINER_STYLE}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: showBoth ? "1fr 1fr" : "1fr",
              gap: 32,
              alignItems: "start",
              justifyItems: "center",
            }}
          >
            <div>
              <div style={PANEL_LABEL_STYLE}>AUTHORED · live layer stack</div>
              <CodexCardFace
                slug={config.cardSlug}
                width={width}
                depthStub={config.depthStub}
                debug={config.debug}
              />
            </div>
            {showBoth && config.cardSlug && (
              <div>
                <div style={PANEL_LABEL_STYLE}>
                  COMPOSITE · gumi&apos;s baked webp
                </div>
                <img
                  src={getCompositeUrl(config.cardSlug)}
                  alt={`composite ${config.cardSlug}`}
                  style={{
                    width,
                    height: width * (1024 / CANVAS_W),
                    objectFit: "contain",
                    background: "#1a1410",
                    borderRadius: 4,
                  }}
                />
              </div>
            )}
          </div>

          {config.showStatus && (
            <KitchenStatus
              activeSlug={config.cardSlug}
              activeMeta={indexed}
              cardCount={cards.length}
              err={err}
            />
          )}
        </div>
      </LabPortal>
    </>
  );
}

function KitchenStatus({
  activeSlug,
  activeMeta,
  cardCount,
  err,
}: {
  activeSlug: string;
  activeMeta: CodexCardIndexEntryT | undefined;
  cardCount: number;
  err: string | null;
}) {
  // Live consumer reading: count CardFace instances by render-via attr. This
  // is observation, not prescription — see [[bookshelf-curated-not-crawled]]:
  // status reflects what's actually mounted, not a manifest.
  const [consumers, setConsumers] = useState({
    codex: 0,
    legacy: 0,
    resolving: 0,
  });
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined") return;
      const all = document.querySelectorAll<HTMLElement>("[data-render-via]");
      let codex = 0;
      let legacy = 0;
      let resolving = 0;
      all.forEach((el) => {
        const via = el.dataset.renderVia;
        if (via === "codex") codex++;
        else if (via === "legacy-registry") legacy++;
        else if (via === "resolving") resolving++;
      });
      setConsumers({ codex, legacy, resolving });
    };
    tick();
    const interval = window.setInterval(tick, 1500);
    return () => window.clearInterval(interval);
  }, []);

  const totalCardFaces = consumers.codex + consumers.legacy + consumers.resolving;
  const codexShare =
    totalCardFaces > 0
      ? Math.round((consumers.codex / totalCardFaces) * 100)
      : 0;

  return (
    <div style={STATUS_STYLE}>
      <div style={{ marginBottom: 10, opacity: 0.9 }}>
        ╭─ kitchen state ────────────────────────────────────────────────╮
      </div>
      <div style={{ paddingLeft: 16 }}>
        <div>
          🥕 <strong style={{ color: "#fde0bc" }}>pantry</strong> · {cardCount}{" "}
          card{cardCount === 1 ? "" : "s"} sourced from codex
        </div>
        <div>
          🍳 <strong style={{ color: "#fde0bc" }}>cooking</strong> ·{" "}
          <code>{activeSlug || "—"}</code>
          {activeMeta && (
            <em style={{ opacity: 0.65, marginLeft: 6 }}>
              · {activeMeta.canon_tier} · {activeMeta.element}
            </em>
          )}
        </div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          📡 <strong style={{ color: "#fde0bc" }}>pipeline</strong> ·
        </div>
        <div style={{ paddingLeft: 20, opacity: 0.7, lineHeight: 1.6 }}>
          codex/cards/ → <code>CodexCardFace</code> → <code>CardFace</code>{" "}
          (dispatch)
          <br />
          &nbsp;&nbsp;&nbsp;↳ consumed by:{" "}
          <code>card-lab</code> (vfx HandRack) · <code>CardHandFan</code>{" "}
          (battle) · <code>CardShowcase</code> (playback)
        </div>
        <div style={{ marginTop: 8 }}>
          📊 <strong style={{ color: "#fde0bc" }}>live render distribution</strong>{" "}
          (this page) ·
        </div>
        <div style={{ paddingLeft: 20, opacity: 0.85 }}>
          <span style={{ color: "#7fd8a3" }}>● codex</span> {consumers.codex}{" "}
          · <span style={{ color: "#f0c060" }}>● legacy</span> {consumers.legacy}
          {consumers.resolving > 0 && (
            <>
              {" "}
              ·{" "}
              <span style={{ color: "#9ab" }}>● resolving</span>{" "}
              {consumers.resolving}
            </>
          )}
          {totalCardFaces > 0 && (
            <em style={{ opacity: 0.55, marginLeft: 8 }}>
              · {codexShare}% codex-rendered
            </em>
          )}
          {totalCardFaces === 0 && (
            <em style={{ opacity: 0.55, marginLeft: 8 }}>
              · no CardFace mounted on this page yet (open card-lab or /battle-v2)
            </em>
          )}
        </div>
        <div style={{ marginTop: 10, opacity: 0.5, fontSize: 9 }}>
          kitchen → frontend · pipeline wired; codex coverage grows as gumi
          authors more cards
        </div>
        {err && (
          <div style={{ marginTop: 6, color: "#ff8a6b" }}>· {err}</div>
        )}
      </div>
      <div style={{ marginTop: 10, opacity: 0.9 }}>
        ╰────────────────────────────────────────────────────────────────╯
      </div>
    </div>
  );
}
