/**
 * AC-1 + AC-2 + AC-2a + AC-3: schema + content vendoring + AJV validation
 */

import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, test } from "vitest";

import {
  inferKind,
  loadYaml,
  loadPack,
  buildContentDatabase,
} from "../content/loader";

const PURUPURU_DIR = resolve(__dirname, "..");
const SCHEMAS_DIR = join(PURUPURU_DIR, "schemas");
const CONTENT_DIR = join(PURUPURU_DIR, "content/wood");
const VALIDATION_RULES = join(PURUPURU_DIR, "contracts/validation_rules.md");

describe("AC-1: 8 vendored JSON schemas", () => {
  const expected = [
    "element.schema.json",
    "card.schema.json",
    "zone.schema.json",
    "event.schema.json",
    "presentation_sequence.schema.json",
    "ui_screen.schema.json",
    "content_pack_manifest.schema.json",
    "telemetry_event.schema.json",
  ];
  for (const file of expected) {
    test(`schema present: ${file}`, () => {
      expect(existsSync(join(SCHEMAS_DIR, file))).toBe(true);
    });
  }
});

describe("AC-2: vendored YAML examples in lib/purupuru/content/wood/", () => {
  const expected = [
    "card.earth_grounding.yaml",
    "card.fire_kindling.yaml",
    "card.metal_tempering.yaml",
    "card.water_flowing.yaml",
    "card.wood_awakening.yaml",
    "element.earth.yaml",
    "element.fire.yaml",
    "element.metal.yaml",
    "element.water.yaml",
    "element.wood.yaml",
    "event.wood_spring_seedling.yaml",
    "pack.core_wood_demo.yaml",
    "sequence.wood_activation.yaml",
    "telemetry.card_activation_clarity.yaml",
    "ui.world_map_screen.yaml",
    "zone.wood_grove.yaml",
  ];
  for (const file of expected) {
    test(`yaml present: ${file}`, () => {
      expect(existsSync(join(CONTENT_DIR, file))).toBe(true);
    });
  }
  test("pack directory contains the expected YAML files", () => {
    const yamls = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".yaml")).sort();
    expect(yamls).toEqual([...expected].sort());
  });
});

describe("AC-2a: validation_rules.md vendored", () => {
  test("validation_rules.md exists", () => {
    expect(existsSync(VALIDATION_RULES)).toBe(true);
  });
});

describe("AC-3: every YAML validates against its schema (AJV2020)", () => {
  test("inferKind handles all 8 prefixes", () => {
    expect(inferKind("element.wood.yaml")).toBe("element");
    expect(inferKind("card.wood_awakening.yaml")).toBe("card");
    expect(inferKind("zone.wood_grove.yaml")).toBe("zone");
    expect(inferKind("event.wood_spring_seedling.yaml")).toBe("event");
    expect(inferKind("sequence.wood_activation.yaml")).toBe("sequence");
    expect(inferKind("ui.world_map_screen.yaml")).toBe("ui");
    expect(inferKind("pack.core_wood_demo.yaml")).toBe("pack");
    expect(inferKind("telemetry.card_activation_clarity.yaml")).toBe("telemetry");
  });

  const yamls = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".yaml"));
  for (const file of yamls) {
    test(`validates: ${file}`, () => {
      expect(() => loadYaml(join(CONTENT_DIR, file))).not.toThrow();
    });
  }

  test("loadPack returns the current wood demo pack shape", () => {
    const pack = loadPack(CONTENT_DIR);
    expect(pack.elements).toHaveLength(5);
    expect(pack.cards).toHaveLength(5);
    expect(pack.zones).toHaveLength(1);
    expect(pack.events).toHaveLength(1);
    expect(pack.sequences).toHaveLength(1);
    expect(pack.uiScreens).toHaveLength(1);
    expect(pack.telemetryEvents).toHaveLength(1);
    expect(pack.manifest).toBeDefined();
  });

  test("buildContentDatabase resolves loaded entries by id", () => {
    const pack = loadPack(CONTENT_DIR);
    const db = buildContentDatabase(pack);
    expect(db.getCardDefinition("wood_awakening")).toBeDefined();
    expect(db.getZoneDefinition("wood_grove")).toBeDefined();
    expect(db.getEventDefinition("wood_spring_seedling")).toBeDefined();
    expect(db.getPresentationSequence("wood_activation_sequence")).toBeDefined();
    expect(db.getElementDefinition("wood")).toBeDefined();
    expect(db.getElementDefinition("fire")).toBeDefined();
    expect(db.getElementDefinition("earth")).toBeDefined();
    expect(db.getElementDefinition("metal")).toBeDefined();
    expect(db.getElementDefinition("water")).toBeDefined();
  });

  test("normalizer: card resolverSteps populated from YAML resolver.steps", () => {
    const pack = loadPack(CONTENT_DIR);
    const card = pack.cards.find((entry) => entry.data.id === "wood_awakening")?.data;
    expect(card).toBeDefined();
    if (!card) throw new Error("wood_awakening card missing from pack");
    expect(card.resolverSteps).toBeDefined();
    expect(card.resolverSteps.length).toBeGreaterThan(0);
    // wood_awakening has 3 resolver steps per the YAML
    expect(card.resolverSteps).toHaveLength(3);
    expect(card.resolverSteps.map((s) => s.op)).toEqual([
      "activate_zone",
      "spawn_event",
      "grant_reward",
    ]);
  });

  test("normalizer: event resolverSteps populated from YAML resolver.steps", () => {
    const pack = loadPack(CONTENT_DIR);
    const event = pack.events[0].data;
    expect(event.resolverSteps).toBeDefined();
    expect(event.resolverSteps).toHaveLength(2);
    expect(event.resolverSteps.map((s) => s.op)).toEqual([
      "set_flag",
      "add_resource",
    ]);
  });
});
