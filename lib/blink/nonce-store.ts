/**
 * S2-T4 · Vercel KV nonce store · atomic check-and-set replay protection
 *
 * Per SDD r2 §3.3 (HIGH-2 + HIGH-780 fixes):
 *
 *   - Vercel KV (durable Redis) NOT in-memory Set · cross-instance durability on
 *     Vercel's stateless function model is mandatory (multiple lambdas could
 *     otherwise see the same nonce as fresh).
 *   - `SET key value NX EX 300` · single atomic operation · NOT GET-then-SET
 *     (race window). NX returns "OK" only when key didn't exist, null otherwise.
 *     5-minute TTL matches ClaimMessage.expiresAt window · auto-cleanup.
 *   - strongly-consistent reads · single-region iad1 · these are configured at
 *     KV provisioning time on Vercel (NOT settable here · documented for ops).
 *   - fail-closed: KV unreachable → "kv-down" → caller returns 503 (not 400) so
 *     users retry rather than giving up. Throwing through the call site would
 *     also work but a ternary return keeps the API surface small.
 *
 * Threat model · why "replay" is a hard reject:
 *   The same nonce twice means a) the user is retrying (rare · minted already)
 *   or b) an attacker is replaying a captured tx (more likely after the first
 *   claim). Either way · refuse. The off-chain claim_genesis_stone signed bytes
 *   are valid forever within their expiresAt window if no nonce store enforces
 *   single-use; the nonce is the only thing preventing a captured POST-mint
 *   response from being submitted to chain twice.
 */

import { kv } from "@vercel/kv";

export type ClaimNonceResult = "fresh" | "replay" | "kv-down";

const NONCE_TTL_SECONDS = 300;
const NONCE_KEY_PREFIX = "puru:nonce:";

// Minimal interface · matches @vercel/kv's set signature for the subset we use.
// Exported so tests can supply an in-memory mock without vi.mock module-replace.
export interface NonceStore {
  set(key: string, value: string, opts: { nx: true; ex: number }): Promise<"OK" | null | unknown>;
}

/**
 * Atomically claim a nonce · returns "fresh" if first time seen, "replay"
 * if already claimed within TTL, "kv-down" if KV is unreachable.
 *
 * Caller MUST treat any non-"fresh" return as a hard rejection.
 *
 * `store` parameter exists for testability · production code calls without
 * args and uses the @vercel/kv default singleton.
 */
export async function claimNonce(nonce: string, store: NonceStore = kv): Promise<ClaimNonceResult> {
  if (!nonce || typeof nonce !== "string") return "kv-down";
  try {
    const result = await store.set(`${NONCE_KEY_PREFIX}${nonce}`, "1", {
      nx: true,
      ex: NONCE_TTL_SECONDS,
    });
    return result === "OK" ? "fresh" : "replay";
  } catch {
    return "kv-down";
  }
}

// Exposed for tests + ops dashboards.
export const NONCE_TTL = NONCE_TTL_SECONDS;
export const NONCE_KEY_NAMESPACE = NONCE_KEY_PREFIX;
