// BaziQuizState · schema decode tests + HMAC sign/verify tests

import { createHmac, randomBytes } from "node:crypto";
import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";

import {
  BaziQuizState,
  CompletedQuizState,
  signQuizState,
  verifyQuizState,
} from "../src/bazi-quiz-state";

const TEST_KEY = randomBytes(32);

describe("BaziQuizState · GET-chain URL state shape", () => {
  it("decodes valid in-progress state (step 3 with 2 prior answers)", () => {
    const state = {
      step: 3,
      answers: [0, 2],
      mac: "placeholder-mac-from-s1-t2",
    };
    const decoded = S.decodeUnknownSync(BaziQuizState)(state);
    expect(decoded.step).toBe(3);
    expect(decoded.answers).toEqual([0, 2]);
  });

  it("rejects step out of range (1-9 · 9=completed sentinel)", () => {
    expect(() => S.decodeUnknownSync(BaziQuizState)({ step: 0, answers: [], mac: "x" })).toThrow();
    expect(() => S.decodeUnknownSync(BaziQuizState)({ step: 10, answers: [], mac: "x" })).toThrow();
  });

  it("accepts step=9 (completed sentinel · all 8 answers in)", () => {
    type A = 0 | 1 | 2 | 3 | 4;
    const decoded = S.decodeUnknownSync(BaziQuizState)({
      step: 9,
      answers: [0, 1, 2, 3, 4, 0, 1, 2] as A[],
      mac: "x",
    });
    expect(decoded.step).toBe(9);
    expect(decoded.answers.length).toBe(8);
  });

  it("rejects invalid answer values (must be 0-4)", () => {
    expect(() => S.decodeUnknownSync(BaziQuizState)({ step: 2, answers: [5], mac: "x" })).toThrow();
    expect(() =>
      S.decodeUnknownSync(BaziQuizState)({ step: 2, answers: [-1], mac: "x" }),
    ).toThrow();
  });

  it("accepts answer=4 (the new 5th option per Q · maps to 5th element)", () => {
    const decoded = S.decodeUnknownSync(BaziQuizState)({
      step: 3,
      answers: [4, 4],
      mac: "x",
    });
    expect(decoded.answers).toEqual([4, 4]);
  });

  it("CompletedQuizState requires exactly 8 answers", () => {
    type A = 0 | 1 | 2 | 3 | 4;
    const completed = {
      answers: [0, 1, 2, 3, 4, 0, 1, 2] as [A, A, A, A, A, A, A, A],
      mac: "placeholder",
    };
    const decoded = S.decodeUnknownSync(CompletedQuizState)(completed);
    expect(decoded.answers.length).toBe(8);
  });

  it("CompletedQuizState rejects 5 answers (was the v0 length · now incomplete)", () => {
    expect(() =>
      S.decodeUnknownSync(CompletedQuizState)({
        answers: [0, 1, 2, 3, 4],
        mac: "x",
      }),
    ).toThrow();
  });
});

describe("BaziQuizState · HMAC sign/verify (S2-T2)", () => {
  it("roundtrip: signed state verifies with matching key", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(signed.step).toBe(3);
    expect(signed.answers).toEqual([0, 2]);
    expect(signed.mac).toMatch(/^[0-9a-f]{64}$/); // 32-byte HMAC-SHA256 hex
    expect(verifyQuizState(signed, { key: TEST_KEY })).toBe(true);
  });

  it("verifies the boundary states (step=1 empty answers and step=8 seven answers)", () => {
    const start = signQuizState({ step: 1, answers: [] }, { key: TEST_KEY });
    expect(verifyQuizState(start, { key: TEST_KEY })).toBe(true);

    const last = signQuizState({ step: 8, answers: [0, 1, 2, 3, 4, 0, 1] }, { key: TEST_KEY });
    expect(verifyQuizState(last, { key: TEST_KEY })).toBe(true);
  });

  it("verifies a step using answer=4 (the new 5th option)", () => {
    const signed = signQuizState({ step: 3, answers: [4, 4] }, { key: TEST_KEY });
    expect(verifyQuizState(signed, { key: TEST_KEY })).toBe(true);
  });

  it("deterministic: same input produces identical mac across calls", () => {
    const a = signQuizState({ step: 4, answers: [0, 1, 2] }, { key: TEST_KEY });
    const b = signQuizState({ step: 4, answers: [0, 1, 2] }, { key: TEST_KEY });
    expect(a.mac).toBe(b.mac);
  });

  it("rejects tampered step", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState({ ...signed, step: 4 }, { key: TEST_KEY })).toBe(false);
  });

  it("rejects tampered answers (single bit flip)", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState({ ...signed, answers: [0, 3] }, { key: TEST_KEY })).toBe(false);
  });

  it("rejects tampered mac (single hex char flip)", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    const flipped = (signed.mac[0] === "f" ? "0" : "f") + signed.mac.slice(1);
    expect(verifyQuizState({ ...signed, mac: flipped }, { key: TEST_KEY })).toBe(false);
  });

  it("rejects wrong key", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState(signed, { key: randomBytes(32) })).toBe(false);
  });

  it("rejects mac of wrong length (32 hex chars instead of 64)", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState({ ...signed, mac: signed.mac.slice(0, 32) }, { key: TEST_KEY })).toBe(
      false,
    );
  });

  it("rejects malformed mac (non-hex chars)", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState({ ...signed, mac: "z".repeat(64) }, { key: TEST_KEY })).toBe(false);
  });

  it("rejects state where answers.length !== step - 1 (invariant)", () => {
    // Attacker tries to reuse legit mac with mismatched (step, answers).
    // Caught by invariant check before HMAC compare.
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState({ ...signed, answers: [0] }, { key: TEST_KEY })).toBe(false);
    expect(verifyQuizState({ ...signed, answers: [0, 2, 3] }, { key: TEST_KEY })).toBe(false);
  });

  it("rejects out-of-range step (defense-in-depth · 0, 9, fractional, NaN)", () => {
    const goodMac = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY }).mac;
    // Bypassing the schema, simulate a malformed input slipping through
    expect(
      verifyQuizState({ step: 0 as unknown as 1, answers: [], mac: goodMac }, { key: TEST_KEY }),
    ).toBe(false);
    expect(
      verifyQuizState(
        { step: 9 as unknown as 1, answers: [0, 1, 2, 3, 0, 1, 2, 3], mac: goodMac },
        { key: TEST_KEY },
      ),
    ).toBe(false);
    expect(
      verifyQuizState({ step: 2.5 as unknown as 1, answers: [0], mac: goodMac }, { key: TEST_KEY }),
    ).toBe(false);
  });

  it("rejects out-of-range answer values (must be 0..4)", () => {
    const signed = signQuizState({ step: 3, answers: [0, 2] }, { key: TEST_KEY });
    expect(verifyQuizState({ ...signed, answers: [0, 5 as unknown as 4] }, { key: TEST_KEY })).toBe(
      false,
    );
    expect(
      verifyQuizState({ ...signed, answers: [0, -1 as unknown as 0] }, { key: TEST_KEY }),
    ).toBe(false);
  });

  it("length-extension forgery FAILS · attacker without key cannot extend a valid mac", () => {
    // Threat model: attacker sees signed state {step:2, answers:[1], mac:M1}
    // and wants to forge a mac for {step:3, answers:[1, X]} without key.
    //
    // Raw SHA-256 is vulnerable: given H(m), an attacker can compute
    // H(m || sha256pad(m) || suffix) without knowing m. THIS IMPLEMENTATION
    // uses HMAC-SHA256 (createHmac, NOT createHash) which is the standard
    // mitigation: the outer hash re-prefixes with K xor opad, which the
    // attacker cannot replicate.
    //
    // Verify the property holds: any mac the attacker can produce without
    // the key (e.g., by re-hashing extended inputs with a different key,
    // or by appending bytes to the original tag) MUST fail verification.

    const legit = signQuizState({ step: 2, answers: [1] }, { key: TEST_KEY });

    // Naive forgery 1: re-mac with attacker's own key
    const attackerKey = randomBytes(32);
    const forgedMacWithDiffKey = createHmac("sha256", attackerKey)
      .update(Buffer.from([1, 3, 2, 1, 2])) // mimics canonical {step:3, answers:[1,2]}
      .digest("hex");
    expect(
      verifyQuizState({ step: 3, answers: [1, 2], mac: forgedMacWithDiffKey }, { key: TEST_KEY }),
    ).toBe(false);

    // Naive forgery 2: replay legit mac for an extended state
    expect(verifyQuizState({ step: 3, answers: [1, 2], mac: legit.mac }, { key: TEST_KEY })).toBe(
      false,
    );

    // Naive forgery 3: append bytes to legit.mac (length-extension on the tag)
    const extendedMac = legit.mac + "00".repeat(8);
    expect(verifyQuizState({ step: 3, answers: [1, 2], mac: extendedMac }, { key: TEST_KEY })).toBe(
      false,
    );
  });

  it("env var: signQuizState falls back to QUIZ_HMAC_KEY when opts.key absent", () => {
    const envKey = randomBytes(32).toString("hex");
    const original = process.env.QUIZ_HMAC_KEY;
    process.env.QUIZ_HMAC_KEY = envKey;
    try {
      const signed = signQuizState({ step: 2, answers: [1] });
      expect(verifyQuizState(signed)).toBe(true);
      // Different key must reject
      expect(verifyQuizState(signed, { key: randomBytes(32) })).toBe(false);
    } finally {
      if (original === undefined) delete process.env.QUIZ_HMAC_KEY;
      else process.env.QUIZ_HMAC_KEY = original;
    }
  });

  it("env var: missing QUIZ_HMAC_KEY throws with actionable message", () => {
    const original = process.env.QUIZ_HMAC_KEY;
    delete process.env.QUIZ_HMAC_KEY;
    try {
      expect(() => signQuizState({ step: 1, answers: [] })).toThrow(/QUIZ_HMAC_KEY/);
    } finally {
      if (original !== undefined) process.env.QUIZ_HMAC_KEY = original;
    }
  });

  it("env var: malformed QUIZ_HMAC_KEY (wrong length) throws", () => {
    const original = process.env.QUIZ_HMAC_KEY;
    process.env.QUIZ_HMAC_KEY = "deadbeef"; // 8 hex chars · way too short
    try {
      expect(() => signQuizState({ step: 1, answers: [] })).toThrow(/64 hex chars/);
    } finally {
      if (original === undefined) delete process.env.QUIZ_HMAC_KEY;
      else process.env.QUIZ_HMAC_KEY = original;
    }
  });

  it("opts.key with wrong length throws", () => {
    expect(() => signQuizState({ step: 1, answers: [] }, { key: Buffer.alloc(16) })).toThrow(
      /32 bytes/,
    );
  });
});
