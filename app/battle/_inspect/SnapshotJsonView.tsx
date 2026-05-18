"use client";

/**
 * SnapshotJsonView — collapsible JSON view of the live MatchSnapshot.
 *
 * Verbose arrays (collection, clashSequence, rounds) are collapsed into
 * `<n items>` placeholders by the replacer to keep the panel compact.
 * Click the placeholder to expand (toggles a Set in component state).
 */

import { useState } from "react";
import { useMatch } from "@/lib/runtime/match.client";

const VERBOSE_KEYS = new Set([
  "collection",
  "clashSequence",
  "rounds",
  "p1Combos",
  "p2Combos",
]);

export function SnapshotJsonView() {
  const snap = useMatch();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!snap) return <p className="dev-empty">no snapshot</p>;

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const lines: { k: string; v: string; verbose?: boolean }[] = [];
  for (const [k, v] of Object.entries(snap)) {
    if (Array.isArray(v) && VERBOSE_KEYS.has(k) && !expanded.has(k)) {
      lines.push({ k, v: `[${v.length} items · click to expand]`, verbose: true });
    } else {
      lines.push({ k, v: stringify(v) });
    }
  }

  return (
    <section className="dev-section">
      <h3 className="dev-h3">snapshot</h3>
      <pre className="dev-json">
        {lines.map(({ k, v, verbose }) => (
          <div
            key={k}
            className={`dev-json-line${verbose ? " dev-json-line--clickable" : ""}`}
            onClick={verbose ? () => toggle(k) : undefined}
          >
            <span className="dev-json-key">{k}</span>
            <span className="dev-json-colon">:</span>
            <span className="dev-json-value">{v}</span>
          </div>
        ))}
      </pre>
    </section>
  );
}

function stringify(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length} items]`;
  if (v instanceof Set) return `Set(${v.size})`;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v).slice(0, 80);
    } catch {
      return "[Object]";
    }
  }
  return String(v);
}
