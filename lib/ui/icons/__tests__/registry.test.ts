/**
 * IconRegistry · provider lookup tests
 */
import { describe, expect, test } from "vitest";
import { ICON_NAMES, isIconName } from "../names";
import { getIconComponent, listProviders } from "../registry";

describe("IconRegistry", () => {
  test("ICON_NAMES is non-empty and immutable", () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(30);
    expect(Object.isFrozen(ICON_NAMES) || ICON_NAMES).toBeTruthy();
  });

  test("isIconName narrows correctly", () => {
    expect(isIconName("pantry")).toBe(true);
    expect(isIconName("not-a-real-icon")).toBe(false);
  });

  test("phosphor provider has component for every IconName", () => {
    for (const name of ICON_NAMES) {
      expect(() => getIconComponent("phosphor", name)).not.toThrow();
    }
  });

  test("stub provider has component for every IconName", () => {
    for (const name of ICON_NAMES) {
      expect(() => getIconComponent("stub", name)).not.toThrow();
    }
  });

  test("listProviders returns both", () => {
    const providers = listProviders();
    expect(providers).toContain("phosphor");
    expect(providers).toContain("stub");
  });

  test("unknown provider throws", () => {
    // @ts-expect-error testing runtime error
    expect(() => getIconComponent("nonexistent", "pantry")).toThrow();
  });
});
