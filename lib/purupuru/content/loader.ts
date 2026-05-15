/**
 * Content loader — YAML → AJV (draft-2020-12) → typed objects.
 *
 * Per SDD r1 §8 + S0 calibration insight (Ajv2020, NOT default Ajv).
 *
 * Pack manifests are PROVENANCE-ONLY (Codex SKP-MEDIUM-002) — the loader
 * discovers colocated YAMLs by directory walk rather than following manifest
 * paths (which reference the harness's `examples/*.yaml` and break post-vendoring).
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, join, resolve as pathResolve } from "node:path";

import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import * as yaml from "js-yaml";

import type {
  CardDefinition,
  ContentDatabase,
  ElementDefinition,
  ElementId,
  PackManifest,
  PresentationSequence,
  ResolverStep,
  TelemetryEventDefinition,
  UiScreenDefinition,
  ZoneDefinition,
  ZoneEventDefinition,
} from "../contracts/types";

// ────────────────────────────────────────────────────────────────────────────
// Schema registry
// ────────────────────────────────────────────────────────────────────────────

const SCHEMA_FILES = [
  "element.schema.json",
  "card.schema.json",
  "zone.schema.json",
  "event.schema.json",
  "presentation_sequence.schema.json",
  "ui_screen.schema.json",
  "content_pack_manifest.schema.json",
  "telemetry_event.schema.json",
] as const;

// Resolve schemas dir relative to project root (process.cwd()).
// Avoids `__dirname` because Next.js bundling rewrites it to a virtual path.
// Override via LOA_PURUPURU_SCHEMAS_DIR for non-standard layouts (tests, ssg, etc.).
const SCHEMAS_DIR =
  process.env.LOA_PURUPURU_SCHEMAS_DIR ??
  pathResolve(process.cwd(), "lib/purupuru/schemas");

let _ajv: Ajv2020 | null = null;
let _validators: Map<string, ValidateFunction> | null = null;

function getAjv(): Ajv2020 {
  if (_ajv === null) {
    _ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(_ajv);
  }
  return _ajv;
}

function getValidator(schemaFile: string): ValidateFunction {
  if (_validators === null) {
    _validators = new Map();
  }
  let v = _validators.get(schemaFile);
  if (!v) {
    const schemaPath = join(SCHEMAS_DIR, schemaFile);
    const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as object;
    v = getAjv().compile(schema);
    _validators.set(schemaFile, v);
  }
  return v;
}

// ────────────────────────────────────────────────────────────────────────────
// Schema-file inference from YAML filename
// ────────────────────────────────────────────────────────────────────────────

export type YamlKind =
  | "element"
  | "card"
  | "zone"
  | "event"
  | "sequence"
  | "ui"
  | "pack"
  | "telemetry";

const FILE_PREFIX_MAP: Record<string, YamlKind> = {
  "element.": "element",
  "card.": "card",
  "zone.": "zone",
  "event.": "event",
  "sequence.": "sequence",
  "ui.": "ui",
  "pack.": "pack",
  "telemetry.": "telemetry",
};

const KIND_SCHEMA_MAP: Record<YamlKind, string> = {
  element: "element.schema.json",
  card: "card.schema.json",
  zone: "zone.schema.json",
  event: "event.schema.json",
  sequence: "presentation_sequence.schema.json",
  ui: "ui_screen.schema.json",
  pack: "content_pack_manifest.schema.json",
  telemetry: "telemetry_event.schema.json",
};

export function inferKind(filename: string): YamlKind {
  const base = basename(filename);
  for (const [prefix, kind] of Object.entries(FILE_PREFIX_MAP)) {
    if (base.startsWith(prefix)) return kind;
  }
  throw new Error(`[loader] Cannot infer kind from filename: ${base}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Result types
// ────────────────────────────────────────────────────────────────────────────

export interface LoaderError {
  readonly path: string;
  readonly schemaFile: string;
  readonly message: string;
  readonly errors: readonly { instancePath: string; message?: string }[];
}

export class ContentValidationError extends Error {
  constructor(public readonly detail: LoaderError) {
    super(`[loader] ${detail.path} failed schema validation against ${detail.schemaFile}: ${detail.message}`);
    this.name = "ContentValidationError";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Camelcase normalizer — YAML resolver.steps → TS resolverSteps
// ────────────────────────────────────────────────────────────────────────────

function normalizeResolverSteps(raw: unknown): readonly ResolverStep[] {
  const obj = raw as { resolver?: { steps?: readonly ResolverStep[] }; resolverSteps?: readonly ResolverStep[] };
  if (Array.isArray(obj.resolverSteps)) return obj.resolverSteps;
  if (obj.resolver && Array.isArray(obj.resolver.steps)) return obj.resolver.steps;
  return [];
}

function normalizeCard(raw: unknown): CardDefinition {
  const base = raw as Partial<CardDefinition> & { resolver?: { steps?: readonly ResolverStep[] } };
  const resolverSteps = normalizeResolverSteps(raw);
  return {
    ...base,
    resolverSteps,
  } as CardDefinition;
}

function normalizeEvent(raw: unknown): ZoneEventDefinition {
  const base = raw as Partial<ZoneEventDefinition> & { resolver?: { steps?: readonly ResolverStep[] } };
  const resolverSteps = normalizeResolverSteps(raw);
  return {
    ...base,
    resolverSteps,
  } as ZoneEventDefinition;
}

// ────────────────────────────────────────────────────────────────────────────
// Single-file loader
// ────────────────────────────────────────────────────────────────────────────

export interface LoadResult<T> {
  readonly data: T;
  readonly sourcePath: string;
  readonly schemaFile: string;
}

export function loadYaml<T>(yamlPath: string): LoadResult<T> {
  const kind = inferKind(yamlPath);
  const schemaFile = KIND_SCHEMA_MAP[kind];
  const validator = getValidator(schemaFile);

  let raw: unknown;
  try {
    raw = yaml.load(readFileSync(yamlPath, "utf8"));
  } catch (e) {
    throw new Error(`[loader] js-yaml parse failed for ${yamlPath}: ${(e as Error).message}`);
  }

  const valid = validator(raw);
  if (!valid) {
    const errors = (validator.errors ?? []).map((err) => ({
      instancePath: err.instancePath || "(root)",
      message: err.message,
    }));
    throw new ContentValidationError({
      path: yamlPath,
      schemaFile,
      message: errors.map((e) => `${e.instancePath} ${e.message}`).join("; "),
      errors,
    });
  }

  // Apply per-kind normalization
  let normalized: unknown = raw;
  if (kind === "card") normalized = normalizeCard(raw);
  if (kind === "event") normalized = normalizeEvent(raw);

  return {
    data: normalized as T,
    sourcePath: yamlPath,
    schemaFile,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Pack-as-provenance loader — directory walk; pack manifest is informational only
// ────────────────────────────────────────────────────────────────────────────

export interface PackContent {
  readonly elements: readonly LoadResult<ElementDefinition>[];
  readonly cards: readonly LoadResult<CardDefinition>[];
  readonly zones: readonly LoadResult<ZoneDefinition>[];
  readonly events: readonly LoadResult<ZoneEventDefinition>[];
  readonly sequences: readonly LoadResult<PresentationSequence>[];
  readonly uiScreens: readonly LoadResult<UiScreenDefinition>[];
  readonly telemetryEvents: readonly LoadResult<TelemetryEventDefinition>[];
  readonly manifest?: LoadResult<PackManifest>;
}

export function loadPack(packDir: string): PackContent {
  if (!existsSync(packDir)) {
    throw new Error(`[loader] Pack directory does not exist: ${packDir}`);
  }
  const files = readdirSync(packDir).filter((f) => f.endsWith(".yaml"));

  const elements: LoadResult<ElementDefinition>[] = [];
  const cards: LoadResult<CardDefinition>[] = [];
  const zones: LoadResult<ZoneDefinition>[] = [];
  const events: LoadResult<ZoneEventDefinition>[] = [];
  const sequences: LoadResult<PresentationSequence>[] = [];
  const uiScreens: LoadResult<UiScreenDefinition>[] = [];
  const telemetryEvents: LoadResult<TelemetryEventDefinition>[] = [];
  let manifest: LoadResult<PackManifest> | undefined;

  for (const file of files) {
    const fullPath = join(packDir, file);
    const kind = inferKind(file);
    switch (kind) {
      case "element":
        elements.push(loadYaml<ElementDefinition>(fullPath));
        break;
      case "card":
        cards.push(loadYaml<CardDefinition>(fullPath));
        break;
      case "zone":
        zones.push(loadYaml<ZoneDefinition>(fullPath));
        break;
      case "event":
        events.push(loadYaml<ZoneEventDefinition>(fullPath));
        break;
      case "sequence":
        sequences.push(loadYaml<PresentationSequence>(fullPath));
        break;
      case "ui":
        uiScreens.push(loadYaml<UiScreenDefinition>(fullPath));
        break;
      case "telemetry":
        telemetryEvents.push(loadYaml<TelemetryEventDefinition>(fullPath));
        break;
      case "pack":
        manifest = loadYaml<PackManifest>(fullPath);
        break;
    }
  }

  return { elements, cards, zones, events, sequences, uiScreens, telemetryEvents, manifest };
}

// ────────────────────────────────────────────────────────────────────────────
// In-memory ContentDatabase
// ────────────────────────────────────────────────────────────────────────────

export function buildContentDatabase(pack: PackContent): ContentDatabase {
  const cards = new Map(pack.cards.map((c) => [c.data.id, c.data]));
  const zones = new Map(pack.zones.map((z) => [z.data.id, z.data]));
  const events = new Map(pack.events.map((e) => [e.data.id, e.data]));
  const sequences = new Map(pack.sequences.map((s) => [s.data.id, s.data]));
  const elements = new Map(pack.elements.map((e) => [e.data.id, e.data]));

  return {
    getCardDefinition: (id) => cards.get(id),
    getZoneDefinition: (id) => zones.get(id),
    getEventDefinition: (id) => events.get(id),
    getPresentationSequence: (id) => sequences.get(id),
    getElementDefinition: (id: ElementId) => elements.get(id),
  };
}
