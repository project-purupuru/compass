"use client";

/**
 * CodexCardFace — the canonical card render driven by Gumi's codex.
 *
 * Sourced from /codex/cards/<slug>/layers.json + the layer PNGs in the same
 * directory. The kitchen primitive (CardComposition) uses this for its
 * AUTHORED pane; the battle CardFace dispatches through this when a gameplay
 * card derives to a codex-authored slug; CardShowcase + HandRack inherit
 * automatically (both flow through CardFace).
 *
 * Sizing: defaults to filling the container while preserving the codex
 * canvas's 733×1024 aspect ratio. Explicit `width` (in px) overrides.
 *
 * Card-meker export conventions honored:
 *   - image layers ship as FULL-CANVAS PNGs (declared bbox is editor
 *     metadata, ignored here)
 *   - assetRef nicknames overlap; resolver slug-matches layer.name
 *   - canvas.border is rendered as an outer border + outside dropShadow
 *
 * Spec gaps (raised on codex PR #1):
 *   - per-layer fileName field needed (assetRef ambiguity)
 *   - exportMode hint needed (full-canvas vs cropped)
 *   - inner-border treatment present in composite, absent from manifest
 */

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import {
  KNOWN_CARD_FILES,
  getCodexCardLayers,
  resolveCodexLayerAssetUrl,
} from "@/lib/cards/codex/CodexCardsPort";
import type {
  CodexImageLayerT,
  CodexLayersManifestT,
  CodexTextLayerT,
} from "@/lib/cards/codex/layers.schema";

interface CodexCardFaceProps {
  readonly slug: string;
  /** Render width in px. Default = fill container at codex aspect ratio. */
  readonly width?: number;
  /** Optional CSS class for the outer container (e.g. card-face__art). */
  readonly className?: string;
  /** When >0, layers gain a CSS perspective + translateZ tilt (V1 preview). */
  readonly depthStub?: number;
  /** When true, every layer gets a thin outline + bbox markers. */
  readonly debug?: boolean;
}

const CANVAS_W = 733;
const CANVAS_H = 1024;

export function CodexCardFace({
  slug,
  width,
  className,
  depthStub = 0,
  debug = false,
}: CodexCardFaceProps) {
  const [manifest, setManifest] = useState<CodexLayersManifestT | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setManifest(null);
    setErr(null);
    getCodexCardLayers(slug)
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Container sizing: explicit width wins; else fill parent at codex aspect.
  const containerStyle: CSSProperties = width
    ? { width, height: width * (CANVAS_H / CANVAS_W) }
    : { width: "100%", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` };

  if (err) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          background: "rgba(255, 138, 107, 0.08)",
          border: "1px dashed rgba(255, 138, 107, 0.4)",
          color: "rgba(255, 138, 107, 0.7)",
          fontFamily: "monospace",
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 8,
        }}
        data-codex-card={slug}
        data-codex-card-state="error"
      >
        codex fetch failed
        <br />
        {slug}
      </div>
    );
  }

  if (!manifest) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          background: "rgba(253, 224, 188, 0.04)",
          border: "1px dashed rgba(253, 224, 188, 0.18)",
        }}
        data-codex-card={slug}
        data-codex-card-state="loading"
      />
    );
  }

  // Outer container is sizing-only AND the CSS container query reference.
  // `containerType: "inline-size"` MUST be here, not on the inner wrapper —
  // `container-type` makes the element a container for its DESCENDANTS, not
  // itself, so cqw values on the inner wrapper (border-radius, box-shadow)
  // would fall back to the viewport without an ancestor container. That was
  // the third regression: radius was resolving to ~24% of viewport (≈456px)
  // instead of 24% of card width (~10px), making everything cartoon-rounded.
  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        position: "relative",
        containerType: "inline-size",
      }}
      data-codex-card={slug}
      data-codex-card-state="ready"
    >
      <FluidLayerStack
        manifest={manifest}
        slug={slug}
        depthStub={depthStub}
        debug={debug}
      />
    </div>
  );
}

/**
 * Renders the layer stack using CSS container queries so the same JSX works
 * at any container width. All px-style values from the manifest are converted
 * to `cqw` (1cqw = 1% of container width) so the card scales fluidly. The
 * cqw-conversion factor is `100 / CANVAS_W` since 100cqw == CANVAS_W "units".
 */
function FluidLayerStack({
  manifest,
  slug,
  depthStub,
  debug,
}: {
  manifest: CodexLayersManifestT;
  slug: string;
  depthStub: number;
  debug: boolean;
}) {
  const { canvas, layers } = manifest;
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const zMin = Math.min(...sorted.map((l) => l.zIndex));
  const zMax = Math.max(...sorted.map((l) => l.zIndex));
  const zSpan = Math.max(1, zMax - zMin);
  const u = 100 / CANVAS_W; // px → cqw factor

  // BORDER GEOMETRY (2026-05-18 · second regression fix):
  //
  // History of attempts:
  //   v1: CSS `border` + box-sizing:border-box. WRONG — inner content area
  //       shrunk by 2*border-width; image layers (inset:0) didn't fill the
  //       visible canvas; white strip at bottom.
  //   v2: `box-shadow: inset` for the border. WRONG — inset shadows draw
  //       BENEATH child elements; the image layers covered the shadow so
  //       the border was invisible. Card looked unframed, with rounded
  //       corners eating the artwork.
  //   v3 (current): wrapper is geometrically simple (no border, no inset
  //       shadow); image layers fill 100% × 100%; a SEPARATE frame-overlay
  //       sibling is rendered AFTER all layers with z 9999 + border + radius.
  //       This matches the composite — frame visibly sits on top of art.
  const ds = canvas.border.dropShadow;
  const outerDropShadow = `${ds.offsetX * u}cqw ${ds.offsetY * u}cqw ${
    ds.blur * u
  }cqw ${ds.spread * u}cqw ${ds.color}`;
  const wrapperStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: canvas.backgroundColor,
    borderRadius: `${canvas.border.radius * u}cqw`,
    boxShadow: outerDropShadow,
    overflow: "hidden",
    transformStyle: depthStub > 0 ? "preserve-3d" : undefined,
    transform:
      depthStub > 0
        ? `perspective(120cqw) rotateY(${depthStub * 12}deg) rotateX(${
            depthStub * 4
          }deg)`
        : undefined,
    transition: "transform 220ms ease",
  };

  return (
    <div style={wrapperStyle}>
      {sorted.map((layer) => {
        const normalizedZ = (layer.zIndex - zMin) / zSpan;
        const depthOffset = depthStub * normalizedZ * 4; // cqw
        const isImage = layer.kind === "image";

        // Card-meker exports image layers as full-canvas PNGs (declared bbox
        // is editor metadata only). Text layers honor their declared bbox.
        const baseStyle: CSSProperties = isImage
          ? {
              position: "absolute",
              inset: 0,
              opacity: layer.opacity,
              zIndex: layer.zIndex,
            }
          : {
              position: "absolute",
              left: `${layer.position.x * u}cqw`,
              top: `${layer.position.y * u}cqw`,
              width: `${layer.size.width * u}cqw`,
              height: `${layer.size.height * u}cqw`,
              opacity: layer.opacity,
              zIndex: layer.zIndex,
            };

        const common: CSSProperties = {
          ...baseStyle,
          transform:
            depthOffset > 0
              ? `translateZ(${depthOffset}cqw) rotate(${layer.rotation}deg)`
              : `rotate(${layer.rotation}deg)`,
          transformStyle: depthStub > 0 ? "preserve-3d" : undefined,
        };

        if (layer.kind === "image") {
          return (
            <ImageLayer
              key={layer.id}
              slug={slug}
              layer={layer}
              style={common}
              debug={debug}
            />
          );
        }
        return (
          <TextLayer
            key={layer.id}
            layer={layer}
            scaleUnit={u}
            style={common}
            debug={debug}
          />
        );
      })}
      {debug &&
        sorted
          .filter((l): l is CodexImageLayerT => l.kind === "image")
          .map((layer) => (
            <DeclaredBboxOutline key={`bbox-${layer.id}`} layer={layer} scaleUnit={u} />
          ))}

      {/* Frame overlay — drawn LAST so it sits ON TOP of every image and
       *  text layer. Mirrors the composite.webp's beige border. Sharp inner
       *  edge (CSS auto-derives inner radius = max(0, outer-radius - width));
       *  if Gumi's composite shows a rounded inner edge, we'd need a custom
       *  clip-path. For V0 this matches the canvas.border export shape. */}
      {canvas.border.enabled && (
        <div
          aria-hidden
          data-codex-frame={slug}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: `${canvas.border.radius * u}cqw`,
            border: `${canvas.border.width * u}cqw solid ${canvas.border.color}`,
            boxSizing: "border-box",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}

function ImageLayer({
  slug,
  layer,
  style,
  debug,
}: {
  slug: string;
  layer: CodexImageLayerT;
  style: CSSProperties;
  debug: boolean;
}) {
  const url = resolveCodexLayerAssetUrl(slug, layer);
  const fallback = KNOWN_CARD_FILES[slug]?.length ?? 0;
  if (!url) {
    return (
      <div
        style={{
          ...style,
          border: "1px dashed rgba(255, 138, 107, 0.5)",
          color: "rgba(255, 138, 107, 0.7)",
          fontFamily: "monospace",
          fontSize: "1.4cqw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          textAlign: "center",
        }}
        data-codex-layer={layer.name}
        data-codex-layer-z={layer.zIndex}
        data-codex-layer-state="missing"
      >
        missing asset
        <br />
        {layer.name} ({fallback} files in card dir)
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={layer.name}
      style={{
        ...style,
        objectFit: "fill",
        pointerEvents: "none",
        outline: debug ? "1px solid rgba(170, 220, 255, 0.5)" : undefined,
      }}
      draggable={false}
      data-codex-layer={layer.name}
      data-codex-layer-z={layer.zIndex}
      data-codex-layer-kind="image"
    />
  );
}

function TextLayer({
  layer,
  scaleUnit,
  style,
  debug,
}: {
  layer: CodexTextLayerT;
  scaleUnit: number;
  style: CSSProperties;
  debug: boolean;
}) {
  const s = layer.text.style;
  const ts = s.textShadow;
  const u = scaleUnit;
  return (
    <div
      style={{
        ...style,
        fontFamily: s.fontFamily,
        fontSize: `${s.fontSize * u}cqw`,
        fontWeight: s.fontWeight,
        fontStyle: s.fontStyle as CSSProperties["fontStyle"],
        color: s.color,
        textAlign: s.textAlign as CSSProperties["textAlign"],
        letterSpacing: `${s.letterSpacing * u}cqw`,
        lineHeight: s.lineHeight,
        textShadow: ts
          ? `${ts.offsetX * u}cqw ${ts.offsetY * u}cqw ${ts.blur * u}cqw ${ts.color}`
          : undefined,
        whiteSpace: "pre-wrap",
        pointerEvents: "none",
        outline: debug ? "1px solid rgba(255, 200, 100, 0.5)" : undefined,
      }}
      data-codex-layer={layer.name}
      data-codex-layer-z={layer.zIndex}
      data-codex-layer-kind="text"
    >
      {layer.text.content}
    </div>
  );
}

function DeclaredBboxOutline({
  layer,
  scaleUnit,
}: {
  layer: CodexImageLayerT;
  scaleUnit: number;
}) {
  const u = scaleUnit;
  return (
    <div
      style={{
        position: "absolute",
        left: `${layer.position.x * u}cqw`,
        top: `${layer.position.y * u}cqw`,
        width: `${layer.size.width * u}cqw`,
        height: `${layer.size.height * u}cqw`,
        border: "1px dashed rgba(255, 60, 200, 0.7)",
        pointerEvents: "none",
        zIndex: 9999,
        boxSizing: "border-box",
      }}
      data-codex-bbox={layer.name}
    >
      <span
        style={{
          position: "absolute",
          top: -14,
          left: 0,
          fontFamily: "monospace",
          fontSize: "1.2cqw",
          color: "rgba(255, 60, 200, 0.9)",
          background: "rgba(0, 0, 0, 0.6)",
          padding: "1px 4px",
          whiteSpace: "nowrap",
        }}
      >
        declared bbox · {layer.name}
      </span>
    </div>
  );
}
