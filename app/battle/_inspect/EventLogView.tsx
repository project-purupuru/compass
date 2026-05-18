"use client";

/**
 * EventLogView — last N MatchEvents with timestamps.
 *
 * Subscribes via useMatchEvent (predicate = always true). Keeps a rolling
 * ring buffer of MAX_EVENTS most recent events for dev inspection.
 */

import { useCallback, useRef, useState } from "react";
import type { MatchEvent } from "@/lib/honeycomb/match.port";
import { useMatchEvent } from "@/lib/runtime/match.client";

const MAX_EVENTS = 8;
const ALWAYS = (_e: MatchEvent) => true;

interface LoggedEvent {
  readonly event: MatchEvent;
  readonly ts: number;
}

export function EventLogView() {
  const [, force] = useState(0);
  const bufRef = useRef<LoggedEvent[]>([]);
  const handler = useCallback((event: MatchEvent) => {
    bufRef.current = [{ event, ts: Date.now() }, ...bufRef.current].slice(0, MAX_EVENTS);
    force((n) => n + 1);
  }, []);
  useMatchEvent(ALWAYS, handler);

  const now = Date.now();
  return (
    <section className="dev-section">
      <h3 className="dev-h3">events (last {MAX_EVENTS})</h3>
      <ul className="dev-events">
        {bufRef.current.length === 0 && <li className="dev-empty">no events yet</li>}
        {bufRef.current.map(({ event, ts }, i) => (
          <li key={`${ts}-${i}`} className="dev-event-row">
            <span className="dev-event-tag">{event._tag}</span>
            <span className="dev-event-ts">{formatAge(now - ts)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatAge(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}
