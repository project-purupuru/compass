/**
 * Regression substrate · Baseline filesystem store
 *
 * Baselines live at `tests/snapshots/lab/<primitive>@<scale>x-<theme>.{png,json}`.
 * sha256 of the PNG is stored in the .json for tamper-detection.
 *
 * Per ADR-8: Docker captures baselines (`pnpm regression:approve`); hot-path
 * checks happen with local Chromium against these committed baselines.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { Schema as S } from "effect";
import { Baseline, type Scale, type Theme } from "./schema";

export const BASELINE_DIR = path.resolve("tests/snapshots/lab");

export function baselinePathPng(primitive: string, scale: Scale, theme: Theme): string {
  return path.join(BASELINE_DIR, `${primitive}@${scale}x-${theme}.png`);
}

export function baselinePathJson(primitive: string, scale: Scale, theme: Theme): string {
  return path.join(BASELINE_DIR, `${primitive}@${scale}x-${theme}.json`);
}

export async function readBaseline(
  primitive: string,
  scale: Scale,
  theme: Theme,
): Promise<Baseline | null> {
  const jsonPath = baselinePathJson(primitive, scale, theme);
  if (!existsSync(jsonPath)) return null;
  const raw = await readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  return S.decodeUnknownSync(Baseline)(parsed);
}

export async function readBaselinePng(
  primitive: string,
  scale: Scale,
  theme: Theme,
): Promise<Buffer | null> {
  const pngPath = baselinePathPng(primitive, scale, theme);
  if (!existsSync(pngPath)) return null;
  return readFile(pngPath);
}

export async function writeBaseline(
  primitive: string,
  scale: Scale,
  theme: Theme,
  pngBuffer: Buffer,
  baseline: Baseline,
): Promise<void> {
  await mkdir(BASELINE_DIR, { recursive: true });
  const pngPath = baselinePathPng(primitive, scale, theme);
  const jsonPath = baselinePathJson(primitive, scale, theme);
  await writeFile(pngPath, pngBuffer);
  await writeFile(jsonPath, JSON.stringify(baseline, null, 2));
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
