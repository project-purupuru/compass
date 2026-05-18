// HYBRID Score Adapter · per SDD r2 §7.1 + bridgebuilder HIGH-3 fix
//
// Resolution at runtime:
//   if process.env.SCORE_API_URL is set:
//     use real score-puru API (with mock fallback on error)
//   else:
//     use lib/score deterministic mock (zerker's authored)
//
// v0 default: mock (matches zerker's hackathon brief "no real backend wiring")
// v0 stretch: env-flag flips to real API for "aliveness from prior collection"
//             (existing PurupuruGenesis Base mints become historical activity feed)
//
// The hybrid resolves the PRD-r6-vs-zerker-brief tension surfaced by bridgebuilder
// HIGH-3 · same interface · adapter-level swap · no consumer change.

// ── Re-export zerker's contract (lib/score is canonical for the score-read shape) ─
//
// Path: packages/world-sources/src/score-adapter.ts → root lib/score/index.ts
// Three '..' segments to escape src/, world-sources/, packages/.
import {
  mockScoreAdapter,
  type Element as ScoreElement,
  type ElementDistribution,
  type ScoreReadAdapter,
  type Wallet,
  type WalletBadge,
  type WalletProfile,
  type WalletSignals,
} from "../../../lib/score/index";

export type {
  ScoreElement,
  ElementDistribution,
  ScoreReadAdapter,
  Wallet,
  WalletBadge,
  WalletProfile,
  WalletSignals,
};

// ── lowercase ↔ uppercase Element translation ─────────────────────────
//
// lib/score uses lowercase ("wood", "fire", ...) per zerker's convention.
// peripheral-events uses uppercase ("WOOD", "FIRE", ...) per our schema.
// Translation lives at this seam to keep both sides idiomatic.

export const scoreElementToCanonical = (
  e: ScoreElement,
): "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER" => {
  switch (e) {
    case "wood":
      return "WOOD";
    case "fire":
      return "FIRE";
    case "earth":
      return "EARTH";
    case "metal":
      return "METAL";
    case "water":
      return "WATER";
  }
};

export const canonicalToScoreElement = (
  e: "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER",
): ScoreElement => {
  switch (e) {
    case "WOOD":
      return "wood";
    case "FIRE":
      return "fire";
    case "EARTH":
      return "earth";
    case "METAL":
      return "metal";
    case "WATER":
      return "water";
  }
};

// ── HTTP adapter for real score-puru API ──────────────────────────────
//
// score-puru-production.up.railway.app/v1
// SDD r2 §7.1 stretch · v0 stretch only (gates on SCORE_API_URL env)

interface RealAdapterConfig {
  apiUrl: string;
  apiKey?: string;
}

const buildRealAdapter = (config: RealAdapterConfig): ScoreReadAdapter => {
  const headers: Record<string, string> = {};
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const fetchJson = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${config.apiUrl}${path}`, { headers });
    if (!res.ok) {
      throw new Error(`Score API error: ${res.status} ${path}`);
    }
    return res.json() as Promise<T>;
  };

  return {
    async getWalletProfile(address) {
      try {
        return await fetchJson<WalletProfile | null>(`/wallet/${address}`);
      } catch {
        // graceful fallback to mock on transient API errors
        return mockScoreAdapter.getWalletProfile(address);
      }
    },
    async getWalletBadges(address) {
      try {
        return await fetchJson<WalletBadge[]>(`/wallet/${address}/badges`);
      } catch {
        return mockScoreAdapter.getWalletBadges(address);
      }
    },
    async getWalletSignals(address) {
      try {
        return await fetchJson<WalletSignals | null>(`/wallet/${address}/signals`);
      } catch {
        return mockScoreAdapter.getWalletSignals(address);
      }
    },
    async getElementDistribution() {
      try {
        return await fetchJson<ElementDistribution>(`/ecosystem/elements`);
      } catch {
        return mockScoreAdapter.getElementDistribution();
      }
    },
  };
};

// ── Hybrid resolver ───────────────────────────────────────────────────
//
// Pure factory · takes env (defaults to process.env) · returns ScoreReadAdapter.
// Test-friendly: pass custom env object to test mock-vs-real toggle without
// process.env mutation.

// Loose type · accepts NodeJS.ProcessEnv (any Record<string, string|undefined>)
// while still hinting the two keys we actually read.
export type ResolveScoreAdapterEnv = Record<string, string | undefined> & {
  SCORE_API_URL?: string | undefined;
  SCORE_API_KEY?: string | undefined;
};

export const resolveScoreAdapter = (
  env: ResolveScoreAdapterEnv = process.env as ResolveScoreAdapterEnv,
): ScoreReadAdapter => {
  const apiUrl = env.SCORE_API_URL;
  if (apiUrl && apiUrl.length > 0) {
    return buildRealAdapter({
      apiUrl,
      apiKey: env.SCORE_API_KEY,
    });
  }
  return mockScoreAdapter;
};

// Default export · uses ambient process.env at first call.
// Consumers: `const score = scoreAdapter` for default behavior.
// For test-time injection: `const score = resolveScoreAdapter({ SCORE_API_URL: "..." })`.
export const scoreAdapter: ScoreReadAdapter = resolveScoreAdapter();
