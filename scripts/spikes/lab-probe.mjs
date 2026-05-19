#!/usr/bin/env node
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();

page.on("console", (msg) => console.log(`[browser-${msg.type()}]`, msg.text().slice(0, 200)));
page.on("pageerror", (err) => console.error("[browser-error]", err.message));

await page.goto("http://localhost:3000/battle-v2/vfx-lab", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);

await page.screenshot({ path: "spike-output/lab-1-card-composition.png", fullPage: false });

// Find all EffectPicker buttons by their label text
const buttons = await page.locator("aside button, [data-effect-id]").all();
console.log(`Found ${buttons.length} sidebar buttons`);

// Try clicking hex-scene
console.log("\n--- clicking HEX-SCENE ---");
await page.click("text=HEX-SCENE", { timeout: 5000 }).catch((e) => console.error("hex-scene click:", e.message));
await page.waitForTimeout(2000);
await page.screenshot({ path: "spike-output/lab-2-hex-scene.png", fullPage: false });

const afterHex = await page.evaluate(() => ({
  canvasVisible: !!document.querySelector("canvas"),
  portalCount: document.querySelectorAll("[data-lab-portal]").length,
  activeEffectLabel: document.querySelector("h1")?.nextElementSibling?.textContent || "",
}));
console.log("after hex click:", JSON.stringify(afterHex, null, 2));

// Try clicking tree-fall
console.log("\n--- clicking TREE-FALL ---");
await page.click("text=TREE-FALL", { timeout: 5000 }).catch((e) => console.error("tree-fall click:", e.message));
await page.waitForTimeout(2000);
await page.screenshot({ path: "spike-output/lab-3-tree-fall.png", fullPage: false });

const afterTree = await page.evaluate(() => ({
  canvasVisible: !!document.querySelector("canvas"),
  portalCount: document.querySelectorAll("[data-lab-portal]").length,
  activeEffectLabel: document.querySelector("h1")?.nextElementSibling?.textContent || "",
}));
console.log("after tree-fall click:", JSON.stringify(afterTree, null, 2));

// Try going back to card-composition
console.log("\n--- clicking CARD-COMPOSITION ---");
await page.click("text=CARD-COMPOSITION", { timeout: 5000 }).catch((e) => console.error("card-comp click:", e.message));
await page.waitForTimeout(2000);
await page.screenshot({ path: "spike-output/lab-4-card-back.png", fullPage: false });

const afterCard = await page.evaluate(() => ({
  canvasVisible: !!document.querySelector("canvas"),
  portalCount: document.querySelectorAll("[data-lab-portal]").length,
  activeEffectLabel: document.querySelector("h1")?.nextElementSibling?.textContent || "",
}));
console.log("after card click:", JSON.stringify(afterCard, null, 2));

await browser.close();
