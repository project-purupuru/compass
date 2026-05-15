/**
 * fence-export — turns fences into an agent-ready refinement brief.
 *
 * The export is the whole point of the tool: an operator draws boxes + types
 * notes, and this manufactures a structured payload an agent can act on
 * directly — each region named by its DOM selector and component, not just
 * pixel coordinates.
 */

import { describeRegion, type RectPct } from "./dom-resolve";
import { matchMedia } from "./media-match";
import type { Fence } from "./useFences";

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

function fmtRect(rect: RectPct): string {
  return `x ${fmtPct(rect.xPct)} y ${fmtPct(rect.yPct)} · ${fmtPct(rect.wPct)} wide · ${fmtPct(rect.hPct)} tall`;
}

/** Markdown brief — paste straight into an agent prompt. */
export function toAgentBrief(fences: readonly Fence[]): string {
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const lines: string[] = [];

  lines.push(`# /battle-v2 — Refinement Fences (${fences.length} region${fences.length === 1 ? "" : "s"})`);
  lines.push(
    `> Operator annotations captured ${new Date().toISOString()} · viewport ${vw}×${vh}`,
  );
  lines.push(
    "> Each fence marks a screen region for refinement. Coordinates are viewport-relative percentages.",
  );
  lines.push("");

  if (fences.length === 0) {
    lines.push("_No fences drawn yet. Alt-drag over a region to fence it._");
    return lines.join("\n");
  }

  fences.forEach((fence, i) => {
    const label = fence.label.trim() || "(unlabelled)";
    lines.push(`## Fence ${i + 1} — "${label}"`);
    lines.push(`- **Screen region**: ${fmtRect(fence.rect)} (${describeRegion(fence.rect)})`);
    if (fence.dom) {
      lines.push(`- **DOM under cursor**: \`${fence.dom.selector}\``);
      const meta = [`tag \`${fence.dom.tag}\``];
      if (fence.dom.componentHint) meta.push(`component hint **${fence.dom.componentHint}**`);
      lines.push(`  - ${meta.join(" · ")}`);
      const dataEntries = Object.entries(fence.dom.dataAttributes);
      if (dataEntries.length > 0) {
        lines.push(`  - data: ${dataEntries.map(([k, v]) => `${k}=${v}`).join(", ")}`);
      }
      if (fence.dom.elementRect) {
        lines.push(`  - element bounds: ${fmtRect(fence.dom.elementRect)}`);
      }
    } else {
      lines.push("- **DOM under cursor**: _(empty space / no resolvable element)_");
    }
    lines.push(`- **Refine**: ${fence.note.trim() || "_(no note)_"}`);

    const media = matchMedia(fence.dom);
    if (media.entries.length > 0) {
      lines.push(`- **Available media** (${media.entries.length}):`);
      for (const m of media.entries) {
        const where = m.inCompass
          ? `\`${m.publicUrl}\``
          : `world-purupuru \`${m.sourcePath}\` _(needs copy into public/)_`;
        const el = m.element ? ` · ${m.element}` : "";
        lines.push(`  - ${m.id} (${m.category}${el}) — ${where}`);
      }
    }
    lines.push("");
  });

  return lines.join("\n");
}

/** Pretty JSON — for tooling that wants the raw structure. */
export function toJSON(fences: readonly Fence[]): string {
  return JSON.stringify(
    {
      route: "/battle-v2",
      capturedAt: new Date().toISOString(),
      viewport:
        typeof window !== "undefined"
          ? { width: window.innerWidth, height: window.innerHeight }
          : null,
      fences,
    },
    null,
    2,
  );
}

/** Trigger a file download in the browser. */
export function downloadText(filename: string, text: string, mime: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
