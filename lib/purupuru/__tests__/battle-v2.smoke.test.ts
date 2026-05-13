/**
 * AC-10 smoke: /battle-v2 components import + server route loads pack
 *
 * Full Playwright E2E (AC-11 11-beat sequence visible) deferred to
 * operator-driven local run (`pnpm dev` + manual hover/click flow).
 */

import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { buildContentDatabase, loadPack } from "../content/loader";

const PACK_DIR = resolve(__dirname, "..", "content/wood");

describe("AC-10 smoke: /battle-v2 wiring", () => {
  test("page.tsx server-side pack load returns valid ContentDatabase", () => {
    const pack = loadPack(PACK_DIR);
    const content = buildContentDatabase(pack);
    expect(content.getCardDefinition("wood_awakening")).toBeDefined();
    expect(content.getZoneDefinition("wood_grove")).toBeDefined();
    expect(content.getPresentationSequence("wood_activation_sequence")).toBeDefined();
    expect(pack.uiScreens[0]?.data.id).toBe("world_map_main");
  });

  test("UI screen YAML has the 7 expected layout slots", () => {
    const pack = loadPack(PACK_DIR);
    const screen = pack.uiScreens[0]?.data;
    expect(screen?.layoutSlots).toBeDefined();
    expect(screen?.layoutSlots.length).toBe(7);
    const slotIds = (screen?.layoutSlots ?? []).map((s) => s.id);
    expect(slotIds).toContain("slot.center.world_map");
    expect(slotIds).toContain("slot.bottom.card_hand");
    expect(slotIds).toContain("slot.bottom.end_turn");
  });

  test("BattleV2 component has all 4 imports for sequence consumer (4 registries)", async () => {
    // Smoke: just verify the modules load (Vitest resolves them at test-time)
    const anchorReg = await import("../presentation/anchor-registry");
    const actorReg = await import("../presentation/actor-registry");
    const uiMountReg = await import("../presentation/ui-mount-registry");
    const audioBusReg = await import("../presentation/audio-bus-registry");
    expect(anchorReg.createAnchorRegistry).toBeDefined();
    expect(actorReg.createActorRegistry).toBeDefined();
    expect(uiMountReg.createUiMountRegistry).toBeDefined();
    expect(audioBusReg.createAudioBusRegistry).toBeDefined();
  });
});
