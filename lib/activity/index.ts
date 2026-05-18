/**
 * Activity stream — multi-source: populationStore spawn events (mock,
 * always on) plus the radar Solana indexer (real, opt-in via
 * NEXT_PUBLIC_RADAR_URL). Ad-hoc `seedActivityEvent` side-channel for
 * the post-mint welcome bridge.
 *
 * Architecture:
 *   - populationStore is the source of truth for "who is on the map".
 *   - subscribe() bridges populationStore spawns through toJoin() into
 *     the ActivityEvent shape, AND fans out any seedActivityEvent() calls
 *     to the same subscribers, AND starts the radar poller (browser-only,
 *     no-op if NEXT_PUBLIC_RADAR_URL is unset).
 *   - recent() merges populationStore-derived events + seeded extras
 *     (which now includes radar-source mints), sorted newest-first.
 *
 * Mock + real coexist intentionally (PRD AC-12.9 design choice 2026-05-10):
 * the visual feed is richer when ambient mock spawns interleave with the
 * sparse stream of real on-chain mints during a hackathon demo.
 */

import { populationStore, type SpawnedPuruhani } from "@/lib/sim/population.system";
import { MutationGuard } from "@/lib/registry/mutation-contract";
import { startRadarPolling } from "./radar-source";
import type { ActivityEvent, ActivityStream, JoinActivity } from "./types";

export type {
  ActionKind,
  ActivityEvent,
  ActivityStream,
  JoinActivity,
  MintActivity,
} from "./types";

function toJoin(s: SpawnedPuruhani): JoinActivity {
  return {
    id: `e-${s.seed}`,
    kind: "join",
    origin: "off-chain",
    element: s.primaryElement,
    actor: s.trader,
    at: s.joinedAt,
  };
}

// REGISTRY DOCTRINE applied: extras buffer is closure-captured inside
// `extrasGuard`, not a module-level mutable. Every append goes through a
// registered MutationContract — direct .push() from anywhere else would
// fail to compile (no exported reference) and the ESLint rule
// `no-unregistered-mutation` belt-and-suspenders against future drift.
//
// See grimoires/loa/proposals/registry-doctrine-2026-05-12.md.
const extrasGuard = new MutationGuard<ActivityEvent[]>([]);
extrasGuard.register({
  name: "activity.append",
  description: "Append a single activity event to the extras buffer",
  validate: (e: ActivityEvent) => (e && e.kind ? true : "missing kind"),
  apply: (state, e) => [...state, e],
});
extrasGuard.register({
  name: "activity.clear",
  description: "Drop all extras (test/demo reset)",
  apply: () => [],
});

const subscribers = new Set<(e: ActivityEvent) => void>();

// Bridge populationStore → our subscriber set. Attaches lazily on first
// subscribe; runs once for the lifetime of the module.
let bridgeAttached = false;
function attachBridge(): void {
  if (bridgeAttached) return;
  bridgeAttached = true;

  populationStore.subscribe((s) => {
    const e = toJoin(s);
    for (const cb of subscribers) {
      try {
        cb(e);
      } catch {
        // isolate subscriber errors
      }
    }
  });

  // Radar indexer source — opt-in via NEXT_PUBLIC_RADAR_URL. No-op
  // (returns false) if the env var is unset, so the rail keeps working
  // in pure-mock mode for local dev without any config.
  startRadarPolling((mint) => {
    // ROUTED THROUGH REGISTRY: registered "activity.append" contract,
    // not a direct .push(). Validation runs first.
    extrasGuard.apply("activity.append", mint);
    for (const cb of subscribers) {
      try {
        cb(mint);
      } catch {
        // isolate subscriber errors
      }
    }
  });
}

export const activityStream: ActivityStream = {
  subscribe(cb) {
    attachBridge();
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  },
  recent(n = 20) {
    const fromPop = populationStore.current().map(toJoin);
    const all = [...fromPop, ...extrasGuard.read()];
    all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return all.slice(0, n);
  },
};

/**
 * Demo-bridge seed · pushes one curated JoinActivity into the stream.
 * Used by ObservatoryClient when arriving via the post-mint links.next
 * bridge with `?welcome=<element>` query param so the user's just-minted
 * stone visibly joins the lobby — stand-in until the real indexer wires
 * StoneClaimed events through.
 */
export function seedActivityEvent(event: ActivityEvent): void {
  // ROUTED THROUGH REGISTRY — see extrasGuard above
  extrasGuard.apply("activity.append", event);
  for (const cb of subscribers) {
    try {
      cb(event);
    } catch {
      // isolate subscriber errors
    }
  }
}

/** Reset the extras buffer — used by tests + the dev panel "panic" actions. */
export function clearActivityExtras(): void {
  extrasGuard.apply("activity.clear", undefined);
}
