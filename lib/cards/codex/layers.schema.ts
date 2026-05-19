/**
 * Effect schema for the codex layers manifest shape exported by Gumi's
 * `purupuru-card-meker` (a.k.a. purupuru-cards). The codex is the SoT for
 * card composition (see operator session 2026-05-18 + the kitchen pattern
 * memory). This schema is the parse boundary at the kitchen's edge.
 *
 * Source PR: project-purupuru/construct-purupuru-codex#1 (Earth Jani).
 * Vendored under /public/codex/ for V0 until pack sync catches up.
 */

import { Schema as S } from "effect";

const TextShadow = S.NullOr(
  S.Struct({
    offsetX: S.Number,
    offsetY: S.Number,
    blur: S.Number,
    color: S.String,
  }),
);

const DropShadow = S.Struct({
  offsetX: S.Number,
  offsetY: S.Number,
  blur: S.Number,
  spread: S.Number,
  color: S.String,
});

const Position = S.Struct({ x: S.Number, y: S.Number });
const Size = S.Struct({ width: S.Number, height: S.Number });

export const CodexImageLayer = S.Struct({
  id: S.String,
  kind: S.Literal("image"),
  name: S.String,
  position: Position,
  size: Size,
  rotation: S.Number,
  opacity: S.Number,
  zIndex: S.Number,
  image: S.Struct({
    assetRef: S.String,
    crop: S.NullOr(S.Unknown),
  }),
});

export const CodexTextLayer = S.Struct({
  id: S.String,
  kind: S.Literal("text"),
  name: S.String,
  position: Position,
  size: Size,
  rotation: S.Number,
  opacity: S.Number,
  zIndex: S.Number,
  text: S.Struct({
    content: S.String,
    style: S.Struct({
      fontFamily: S.String,
      fontSize: S.Number,
      fontWeight: S.Number,
      fontStyle: S.String,
      color: S.String,
      textAlign: S.String,
      verticalAlign: S.String,
      letterSpacing: S.Number,
      lineHeight: S.Number,
      textShadow: TextShadow,
      textStroke: S.NullOr(S.Unknown),
      gradient: S.NullOr(S.Unknown),
    }),
    binding: S.NullOr(S.Unknown),
  }),
});

export const CodexLayer = S.Union(CodexImageLayer, CodexTextLayer);

export const CodexCanvas = S.Struct({
  width: S.Number,
  height: S.Number,
  backgroundColor: S.String,
  border: S.Struct({
    enabled: S.Boolean,
    width: S.Number,
    color: S.String,
    radius: S.Number,
    texture: S.String,
    textureOpacity: S.Number,
    dropShadow: DropShadow,
  }),
});

export const CodexCardMeta = S.Struct({
  defId: S.String,
  name: S.String,
  cardType: S.String,
  set: S.String,
  flavorText: S.String,
  element: S.String,
});

export const CodexLayersManifest = S.Struct({
  version: S.Number,
  exportedAt: S.String,
  card: CodexCardMeta,
  canvas: CodexCanvas,
  layers: S.Array(CodexLayer),
});

export const CodexCardIndexEntry = S.Struct({
  id: S.String,
  name: S.String,
  slug: S.String,
  entity_type: S.Literal("card"),
  canon_tier: S.String,
  element: S.String,
  card_type: S.String,
  set: S.String,
  flavor_text: S.String,
  layer_count: S.Number,
  canvas_width: S.Number,
  canvas_height: S.Number,
  source_tool: S.String,
  source_commit: S.String,
  tags: S.Array(S.String),
  cross_references: S.Array(S.String),
});

export type CodexImageLayerT = S.Schema.Type<typeof CodexImageLayer>;
export type CodexTextLayerT = S.Schema.Type<typeof CodexTextLayer>;
export type CodexLayerT = S.Schema.Type<typeof CodexLayer>;
export type CodexCanvasT = S.Schema.Type<typeof CodexCanvas>;
export type CodexCardMetaT = S.Schema.Type<typeof CodexCardMeta>;
export type CodexLayersManifestT = S.Schema.Type<typeof CodexLayersManifest>;
export type CodexCardIndexEntryT = S.Schema.Type<typeof CodexCardIndexEntry>;
