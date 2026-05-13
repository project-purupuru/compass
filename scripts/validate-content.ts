#!/usr/bin/env tsx
/**
 * Validate content pack — AJV schema validation + 5 cycle-1 design lints.
 *
 * Per S1-T5 + AC-3 + AC-3a (Codex SKP-MEDIUM-004).
 *
 * Walks lib/purupuru/content/wood/, AJV-validates each YAML against its schema,
 * then runs 5 design lints against the loaded pack. Exits 0 on success.
 */

import { resolve } from "node:path";

import {
  buildContentDatabase,
  loadPack,
  type PackContent,
} from "../lib/purupuru/content/loader";
import type {
  CardDefinition,
  ElementDefinition,
  PresentationSequence,
  ZoneDefinition,
} from "../lib/purupuru/contracts/types";

const PACK_DIR = resolve(__dirname, "..", "lib/purupuru/content/wood");

interface LintResult {
  readonly id: string;
  readonly ok: boolean;
  readonly message: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Lint 1: card with elementId X must include at least one verb from element.X.verbs
// ────────────────────────────────────────────────────────────────────────────

function lintCardElementVerbs(pack: PackContent): LintResult[] {
  const results: LintResult[] = [];
  const elementVerbs = new Map<string, readonly string[]>();
  for (const e of pack.elements) {
    elementVerbs.set(e.data.id, e.data.verbs);
  }
  for (const c of pack.cards) {
    const card: CardDefinition = c.data;
    const allowed = elementVerbs.get(card.elementId);
    if (!allowed) {
      results.push({
        id: `LINT-1:${card.id}`,
        ok: false,
        message: `card '${card.id}' references unknown elementId '${card.elementId}' (no element definition in pack)`,
      });
      continue;
    }
    const expressed = card.verbs.filter((v) => allowed.includes(v));
    if (expressed.length === 0) {
      results.push({
        id: `LINT-1:${card.id}`,
        ok: false,
        message: `card '${card.id}' (elementId=${card.elementId}) declares verbs ${JSON.stringify(card.verbs)} but none match element verbs ${JSON.stringify(allowed)}`,
      });
    } else {
      results.push({ id: `LINT-1:${card.id}`, ok: true, message: `${card.id}: ${expressed.length} matching verb(s)` });
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// Lint 2: localized-weather sequence beats with scope target_zone_only must
//         only target zones with weatherBehavior: localized_only
// ────────────────────────────────────────────────────────────────────────────

function lintLocalizedWeatherScope(pack: PackContent): LintResult[] {
  const results: LintResult[] = [];
  const zoneWeatherBehavior = new Map<string, string>();
  for (const z of pack.zones) {
    zoneWeatherBehavior.set(z.data.id, z.data.activationRules.weatherBehavior);
  }
  for (const s of pack.sequences) {
    const seq: PresentationSequence = s.data;
    for (const beat of seq.beats) {
      if (beat.action !== "start_vfx_loop") continue;
      const params = beat.params as { scope?: string };
      if (params.scope !== "target_zone_only") continue;
      // Find zone IDs in the target field (heuristic: match anchor.<zoneId>.<...>)
      const match = beat.target.match(/^anchor\.([a-z_]+)\./);
      if (!match) continue;
      const zoneId = match[1];
      const behavior = zoneWeatherBehavior.get(zoneId);
      if (behavior && behavior !== "localized_only") {
        results.push({
          id: `LINT-2:${seq.id}:${beat.id}`,
          ok: false,
          message: `sequence '${seq.id}' beat '${beat.id}' fires localized weather on zone '${zoneId}' but zone weatherBehavior is '${behavior}' (must be 'localized_only')`,
        });
      } else {
        results.push({ id: `LINT-2:${seq.id}:${beat.id}`, ok: true, message: `localized weather on ${zoneId} ok` });
      }
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// Lint 3: input-locking sequences must end in unlock_input beat
// ────────────────────────────────────────────────────────────────────────────

function lintInputLockUnlock(pack: PackContent): LintResult[] {
  const results: LintResult[] = [];
  for (const s of pack.sequences) {
    const seq: PresentationSequence = s.data;
    if (seq.inputPolicy.lockMode === "none") {
      results.push({ id: `LINT-3:${seq.id}`, ok: true, message: "no lock — n/a" });
      continue;
    }
    const hasUnlock = seq.beats.some((b) => b.action === "unlock_input");
    if (!hasUnlock) {
      results.push({
        id: `LINT-3:${seq.id}`,
        ok: false,
        message: `sequence '${seq.id}' uses lockMode='${seq.inputPolicy.lockMode}' but has no 'unlock_input' beat`,
      });
    } else {
      results.push({ id: `LINT-3:${seq.id}`, ok: true, message: "unlock_input beat present" });
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// Lint 4: card targeting tags must reference defined zone tags
// ────────────────────────────────────────────────────────────────────────────

function lintZoneTagsDefined(pack: PackContent): LintResult[] {
  const results: LintResult[] = [];
  const definedTags = new Set<string>();
  for (const z of pack.zones) {
    for (const t of z.data.tags) definedTags.add(t);
  }
  for (const c of pack.cards) {
    const card: CardDefinition = c.data;
    const undefinedTags = card.targeting.validZoneTags.filter((t) => !definedTags.has(t));
    if (undefinedTags.length > 0) {
      results.push({
        id: `LINT-4:${card.id}`,
        ok: false,
        message: `card '${card.id}' targeting references undefined zone tags: ${JSON.stringify(undefinedTags)} (defined: ${JSON.stringify([...definedTags])})`,
      });
    } else {
      results.push({ id: `LINT-4:${card.id}`, ok: true, message: "all zone tags defined" });
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// Lint 5: non-core packs cannot use locked resolver ops (cycle-1 vacuously true)
// ────────────────────────────────────────────────────────────────────────────

const LOCKED_OPS = new Set(["daemon_assist"]); // cycle-1: daemon_assist is reserved no-op

function lintLockedResolverOps(pack: PackContent): LintResult[] {
  const results: LintResult[] = [];
  const tier = pack.manifest?.data.tier ?? "core";
  if (tier === "core") {
    results.push({ id: `LINT-5:pack`, ok: true, message: `core tier — locked ops permitted (vacuously)` });
    return results;
  }
  for (const c of pack.cards) {
    for (const step of c.data.resolverSteps) {
      if (LOCKED_OPS.has(step.op)) {
        results.push({
          id: `LINT-5:${c.data.id}:${step.id}`,
          ok: false,
          message: `card '${c.data.id}' step '${step.id}' uses locked op '${step.op}' but pack tier is '${tier}'`,
        });
      }
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function main(): number {
  console.log(`[validate-content] Loading pack from ${PACK_DIR}`);
  let pack: PackContent;
  try {
    pack = loadPack(PACK_DIR);
  } catch (e) {
    console.error(`[validate-content] Pack load failed:`, e);
    return 1;
  }

  console.log(
    `[validate-content] Pack contents: ${pack.elements.length} elements · ${pack.cards.length} cards · ${pack.zones.length} zones · ${pack.events.length} events · ${pack.sequences.length} sequences · ${pack.uiScreens.length} ui-screens · ${pack.telemetryEvents.length} telemetry · manifest=${pack.manifest ? "yes" : "no"}`,
  );

  // Build content database to ensure references resolve
  buildContentDatabase(pack);

  // Run all lints
  const lints = [
    lintCardElementVerbs,
    lintLocalizedWeatherScope,
    lintInputLockUnlock,
    lintZoneTagsDefined,
    lintLockedResolverOps,
  ];
  const allResults: LintResult[] = [];
  for (const lint of lints) allResults.push(...lint(pack));

  const failures = allResults.filter((r) => !r.ok);
  const successes = allResults.filter((r) => r.ok);

  console.log(`[validate-content] Lint results: ${successes.length} pass · ${failures.length} fail`);
  for (const r of allResults) {
    const sym = r.ok ? "✓" : "✗";
    console.log(`  ${sym} ${r.id} — ${r.message}`);
  }

  if (failures.length > 0) {
    console.error(`[validate-content] ✗ ${failures.length} lint failure(s).`);
    return 1;
  }
  console.log(`[validate-content] ✓ All schemas validated · all lints passed.`);
  return 0;
}

process.exit(main());
