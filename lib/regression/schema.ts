/**
 * Regression substrate · Effect Schema definitions
 *
 * Per SDD §3.1 + ADR-2 (assertion hierarchy: boundingBox PRIMARY, pixel diff ADVISORY).
 * Per Flatline IMP-002: declared hierarchy prevents dual-invariant confusion.
 */

import { Schema as S } from "effect";

export const BoundingBox = S.Struct({
  x: S.Number,
  y: S.Number,
  width: S.Number,
  height: S.Number,
});
export type BoundingBox = S.Schema.Type<typeof BoundingBox>;

export const Theme = S.Literal("light", "dark");
export type Theme = S.Schema.Type<typeof Theme>;

export const Scale = S.Union(
  S.Literal(0.5),
  S.Literal(1),
  S.Literal(2),
);
export type Scale = S.Schema.Type<typeof Scale>;

/**
 * Snapshot envelope — captured per render. Geometry is the primary assertion;
 * sha256 is for image-identity; pngBytes is for diagnostic.
 */
export const Snapshot = S.Struct({
  imageRef: S.String,
  boundingBox: BoundingBox,
  metadata: S.Struct({
    primitive: S.String,
    scale: Scale,
    theme: Theme,
    props: S.Record({ key: S.String, value: S.Unknown }),
  }),
  capturedAt: S.String,
  sha256: S.String,
  pngBytes: S.Number,
});
export type Snapshot = S.Schema.Type<typeof Snapshot>;

export const Baseline = S.Struct({
  primitive: S.String,
  scale: Scale,
  theme: Theme,
  boundingBox: BoundingBox,
  sha256: S.String,
  pngBytes: S.Number,
  capturedAt: S.String,
  capturedIn: S.Literal("docker", "local"),
  approvedReason: S.optional(S.String),
});
export type Baseline = S.Schema.Type<typeof Baseline>;

/**
 * Diff result · discriminated union.
 *
 * Match: geometry + sha256 + pixel-diff all clean
 * GeometryDrift: PRIMARY gate failure — BLOCKS
 * PixelDrift: SECONDARY (advisory) — does NOT block
 * BaselineMissing: no baseline to compare against
 *
 * Per SDD §3.1 hierarchy + Flatline IMP-002.
 */
export const DiffResult = S.Union(
  S.TaggedStruct("Match", {
    boundingBox: BoundingBox,
    sha256: S.String,
  }),
  S.TaggedStruct("GeometryDrift", {
    dimension: S.Literal("width", "height", "x", "y"),
    expected: S.Number,
    actual: S.Number,
    deltaPx: S.Number,
    deltaPct: S.Number,
  }),
  S.TaggedStruct("PixelDrift", {
    diffPixels: S.Number,
    diffPct: S.Number,
    diffImagePath: S.optional(S.String),
  }),
  S.TaggedStruct("BaselineMissing", {
    primitive: S.String,
  }),
);
export type DiffResult = S.Schema.Type<typeof DiffResult>;

export const RenderTarget = S.Struct({
  primitive: S.String,
  scale: Scale,
  theme: Theme,
  props: S.optional(S.Record({ key: S.String, value: S.Unknown })),
});
export type RenderTarget = S.Schema.Type<typeof RenderTarget>;

/**
 * Tolerances · S1a tuned per S0 finding (pixel-diff at ~3% not 0.5%).
 * Geometry MUST be ±0.5px (cross-platform Chromium deterministic).
 */
export const Tolerances = {
  geometryPx: 0.5,
  geometryPct: 0.5,
  pixelDiffPct: 3.0,
} as const;
