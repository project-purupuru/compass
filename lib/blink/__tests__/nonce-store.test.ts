/**
 * S2-T4 · unit tests for nonce-store
 *
 * Mock @vercel/kv via dependency injection · `claimNonce(nonce, store)` accepts
 * a NonceStore mock so we never touch the real KV singleton (which throws on
 * import without env vars). Production code calls claimNonce(nonce) and gets
 * the @vercel/kv kv singleton by default.
 *
 * Coverage:
 *   - fresh nonce returns "fresh" · key written with NX + EX 300
 *   - replay nonce returns "replay" · KV's NX returned null
 *   - KV throws → returns "kv-down" (fail-closed)
 *   - empty/non-string nonce → "kv-down" (defensive)
 *   - parallel same-nonce → only one succeeds
 *   - key namespace prefix applied
 *   - TTL is 300s (matches ClaimMessage 5min window)
 */

import { describe, expect, it, vi } from "vitest";

import { NONCE_KEY_NAMESPACE, NONCE_TTL, claimNonce, type NonceStore } from "../nonce-store";

// In-memory NonceStore that mirrors Redis NX EX semantics.
function makeMemoryStore(): NonceStore & { calls: Array<unknown[]>; map: Map<string, string> } {
  const map = new Map<string, string>();
  const calls: Array<unknown[]> = [];
  return {
    map,
    calls,
    async set(key: string, value: string, opts: { nx: true; ex: number }): Promise<"OK" | null> {
      calls.push([key, value, opts]);
      if (opts.nx && map.has(key)) return null; // collision → null
      map.set(key, value);
      return "OK";
    },
  };
}

describe("claimNonce · fresh and replay semantics", () => {
  it("first claim returns 'fresh'", async () => {
    const store = makeMemoryStore();
    const result = await claimNonce("nonce-abc-123", store);
    expect(result).toBe("fresh");
  });

  it("second claim with same nonce returns 'replay'", async () => {
    const store = makeMemoryStore();
    expect(await claimNonce("nonce-abc-123", store)).toBe("fresh");
    expect(await claimNonce("nonce-abc-123", store)).toBe("replay");
  });

  it("different nonces both succeed independently", async () => {
    const store = makeMemoryStore();
    expect(await claimNonce("nonce-A", store)).toBe("fresh");
    expect(await claimNonce("nonce-B", store)).toBe("fresh");
    expect(await claimNonce("nonce-C", store)).toBe("fresh");
    // None replay each other
    expect(await claimNonce("nonce-A", store)).toBe("replay");
  });
});

describe("claimNonce · NX + EX semantics applied to KV call", () => {
  it("calls store.set with nx:true and ex:300", async () => {
    const store = makeMemoryStore();
    await claimNonce("test-nonce", store);
    expect(store.calls.length).toBe(1);
    const [, , opts] = store.calls[0];
    expect(opts).toEqual({ nx: true, ex: 300 });
  });

  it("namespaces keys with puru:nonce: prefix", async () => {
    const store = makeMemoryStore();
    await claimNonce("xyz-789", store);
    const [key] = store.calls[0];
    expect(key).toBe("puru:nonce:xyz-789");
    // Sanity: prefix exposed for ops
    expect(NONCE_KEY_NAMESPACE).toBe("puru:nonce:");
  });

  it("TTL is 300 seconds (matches ClaimMessage 5min expiresAt window)", () => {
    expect(NONCE_TTL).toBe(300);
  });
});

describe("claimNonce · fail-closed semantics", () => {
  it("returns 'kv-down' when store.set throws", async () => {
    const failingStore: NonceStore = {
      async set() {
        throw new Error("ECONNRESET · KV unreachable");
      },
    };
    expect(await claimNonce("any-nonce", failingStore)).toBe("kv-down");
  });

  it("returns 'kv-down' when store.set rejects with a non-Error", async () => {
    const weirdStore: NonceStore = {
      async set() {
        throw "string thrown";
      },
    };
    expect(await claimNonce("any-nonce", weirdStore)).toBe("kv-down");
  });

  it("returns 'kv-down' on empty nonce (defensive)", async () => {
    const store = makeMemoryStore();
    expect(await claimNonce("", store)).toBe("kv-down");
    expect(store.calls.length).toBe(0); // never even calls the store
  });

  it("returns 'kv-down' on non-string nonce (defensive)", async () => {
    const store = makeMemoryStore();
    // @ts-expect-error · simulating a runtime type violation from upstream code
    expect(await claimNonce(undefined, store)).toBe("kv-down");
    // @ts-expect-error · simulating numeric input slipping past TS at the boundary
    expect(await claimNonce(123, store)).toBe("kv-down");
    expect(store.calls.length).toBe(0);
  });
});

describe("claimNonce · parallel access (atomicity smoke test)", () => {
  it("two concurrent claims of the same nonce: only one is 'fresh'", async () => {
    const store = makeMemoryStore();
    const [a, b] = await Promise.all([
      claimNonce("racey-nonce", store),
      claimNonce("racey-nonce", store),
    ]);
    // The in-memory store doesn't truly race · this asserts the contract our
    // production NX semantics MUST honor (real Vercel KV NX is atomic at the
    // Redis level). If a future refactor drops NX, this test will start
    // flaking under real load · keep the assertion strict.
    const results = [a, b].sort();
    expect(results).toEqual(["fresh", "replay"]);
  });

  it("100 concurrent claims of the same nonce: exactly one 'fresh', 99 'replay'", async () => {
    const store = makeMemoryStore();
    const results = await Promise.all(
      Array.from({ length: 100 }, () => claimNonce("hot-nonce", store)),
    );
    const freshCount = results.filter((r) => r === "fresh").length;
    const replayCount = results.filter((r) => r === "replay").length;
    expect(freshCount).toBe(1);
    expect(replayCount).toBe(99);
  });
});

describe("claimNonce · default store (@vercel/kv)", () => {
  // We don't import the real @vercel/kv (it throws on env-var-less init). This
  // test instead verifies the default-parameter wiring is in place by passing
  // an explicit store and confirming it's used. The full integration path
  // exercises only when KV_REST_API_URL/TOKEN are set in the deploy env.
  it("explicit store parameter is used over the default singleton", async () => {
    const setSpy = vi.fn(async () => "OK" as const);
    const store: NonceStore = { set: setSpy };
    await claimNonce("explicit-store", store);
    expect(setSpy).toHaveBeenCalledOnce();
  });
});
