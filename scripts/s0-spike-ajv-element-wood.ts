#!/usr/bin/env tsx
/**
 * S0-T1 — Calibration spike: AJV validates ONE harness YAML against ONE harness schema
 *
 * Per PRD r2 FR-0 (cycle-1 calibration). Half-day spike. Delete this script after S0 audit
 * approves. Net 0 LOC to cycle. Validates AJV + js-yaml + harness composability before S1
 * commits the full schema vendoring.
 *
 * Asserts:
 *   1. js-yaml parses element.wood.yaml without error
 *   2. AJV compiles element.schema.json without error
 *   3. The parsed YAML validates against the compiled schema
 *   4. Specific known wood fields are present (smoke test on YAML→TS shape)
 *
 * Exit codes:
 *   0  — spike passed
 *   1  — validation failed (see stderr)
 *   78 — harness path not resolved (run pnpm s0:preflight first)
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Harness schemas declare $schema: https://json-schema.org/draft/2020-12/schema
// — use Ajv2020 (NOT default Ajv which uses draft-07). S0 surfaced this
// integration cost before S1 commits.
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import * as yaml from "js-yaml";

function resolveHarnessPath(): string | null {
  const envPath = process.env.LOA_PURUPURU_HARNESS_PATH;
  if (envPath && existsSync(envPath)) return envPath;
  const defaultPath = join(homedir(), "Downloads/purupuru_architecture_harness");
  if (existsSync(defaultPath)) return defaultPath;
  return null;
}

function main(): number {
  const harnessPath = resolveHarnessPath();
  if (!harnessPath) {
    console.error("[s0-spike] harness path not resolved. Run `pnpm s0:preflight` first.");
    return 78;
  }

  console.log(`[s0-spike] Harness path: ${harnessPath}`);

  const schemaPath = join(harnessPath, "schemas/element.schema.json");
  const yamlPath = join(harnessPath, "examples/element.wood.yaml");

  // Step 1: parse YAML
  let yamlContent: unknown;
  try {
    const rawYaml = readFileSync(yamlPath, "utf8");
    yamlContent = yaml.load(rawYaml);
    console.log(`[s0-spike] ✓ js-yaml parsed ${yamlPath}`);
  } catch (e) {
    console.error(`[s0-spike] ✗ js-yaml parse failed:`, e);
    return 1;
  }

  // Step 2: load schema
  let schema: object;
  try {
    schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    console.log(`[s0-spike] ✓ Loaded schema ${schemaPath}`);
  } catch (e) {
    console.error(`[s0-spike] ✗ Schema load failed:`, e);
    return 1;
  }

  // Step 3: compile + validate
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  let validate: ReturnType<typeof ajv.compile>;
  try {
    validate = ajv.compile(schema);
    console.log(`[s0-spike] ✓ AJV compiled schema`);
  } catch (e) {
    console.error(`[s0-spike] ✗ AJV compile failed:`, e);
    return 1;
  }

  const valid = validate(yamlContent);
  if (!valid) {
    console.error(`[s0-spike] ✗ Validation failed:`);
    for (const err of validate.errors ?? []) {
      console.error(`  - ${err.instancePath || "(root)"} ${err.message}`);
    }
    return 1;
  }
  console.log(`[s0-spike] ✓ ${yamlPath} validates against ${schemaPath}`);

  // Step 4: known-field smoke test
  const wood = yamlContent as Record<string, unknown>;
  const expectedFields = ["schemaVersion", "id", "verbs", "colorTokens", "motifs", "vfxGrammar", "audioGrammar"];
  const missing = expectedFields.filter((f) => !(f in wood));
  if (missing.length > 0) {
    console.error(`[s0-spike] ✗ Missing expected fields: ${missing.join(", ")}`);
    return 1;
  }
  if (wood.id !== "wood") {
    console.error(`[s0-spike] ✗ Expected id=wood, got id=${wood.id}`);
    return 1;
  }
  console.log(`[s0-spike] ✓ All 7 expected fields present; id="wood"`);

  console.log("");
  console.log(`[s0-spike] ✓ Calibration spike PASSED.`);
  console.log(`[s0-spike]   AJV + js-yaml + harness composability validated.`);
  console.log(`[s0-spike]   S1 can proceed with full schema vendoring + content loader.`);
  console.log(`[s0-spike]   This script SHOULD BE DELETED after S0 audit-sprint approves.`);
  return 0;
}

process.exit(main());
