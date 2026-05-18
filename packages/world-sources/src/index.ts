// @purupuru/world-sources · adapters per Codex's awareness model §4
// SDD r2 §1+§7.1 · hybrid score-adapter (mock-default · env-flag → real Score API)

export const PACKAGE_VERSION = "0.0.1" as const;

// Score adapter · hybrid (mock default · SCORE_API_URL flips to real)
export {
  canonicalToScoreElement,
  resolveScoreAdapter,
  scoreAdapter,
  scoreElementToCanonical,
  type ResolveScoreAdapterEnv,
} from "./score-adapter";

export type {
  ElementDistribution,
  ScoreElement,
  ScoreReadAdapter,
  Wallet,
  WalletBadge,
  WalletProfile,
  WalletSignals,
} from "./score-adapter";
