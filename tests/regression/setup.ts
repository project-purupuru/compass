/**
 * Vitest setup · regression substrate
 *
 * Loads at the start of every regression test. Ensures the Playwright
 * browser singleton is closed between worker runs.
 */

import { afterAll } from "vitest";
import { teardownPlaywright } from "./render-helpers";

afterAll(async () => {
  await teardownPlaywright();
});
