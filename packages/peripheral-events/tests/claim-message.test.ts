// ClaimMessage schema + canonical 98-byte encoding + ed25519 sign/verify

import { randomBytes } from "node:crypto";
import bs58 from "bs58";
import { Schema as S } from "effect";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import {
  buildClaimMessage,
  byteToElement,
  CLAIM_MESSAGE_SIGNED_BYTES,
  ClaimMessage,
  elementToByte,
  encodeClaimMessage,
  signClaimMessage,
  verifyClaimSignature,
} from "../src/claim-message";

// Helpers for tests · build a well-formed ClaimMessage with controllable fields.
function makeClaim(overrides: Partial<ClaimMessage> = {}): ClaimMessage {
  const walletBytes = randomBytes(32);
  const quizHash = randomBytes(32).toString("hex") as ClaimMessage["quizStateHash"];
  const nonce = randomBytes(16).toString("hex") as ClaimMessage["nonce"];
  return {
    domain: "purupuru.awareness.genesis-stone",
    version: 1,
    cluster: 0,
    programId: bs58.encode(randomBytes(32)),
    wallet: bs58.encode(walletBytes) as ClaimMessage["wallet"],
    element: 2, // FIRE
    weather: 5, // WATER
    quizStateHash: quizHash,
    issuedAt: 1700000000,
    expiresAt: 1700000300,
    nonce,
    ...overrides,
  };
}

function makeSigner(): { secret: Uint8Array; pubkey: Uint8Array } {
  const seed = randomBytes(32);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return { secret: kp.secretKey, pubkey: kp.publicKey };
}

describe("Element byte encoding (1=Wood..5=Water)", () => {
  it("roundtrips all 5 elements", () => {
    const elements = ["WOOD", "FIRE", "EARTH", "METAL", "WATER"] as const;
    for (const e of elements) {
      expect(byteToElement(elementToByte(e))).toBe(e);
    }
  });

  it("rejects invalid byte", () => {
    expect(() => byteToElement(0)).toThrow();
    expect(() => byteToElement(6)).toThrow();
  });
});

describe("ClaimMessage · server-signed payload schema", () => {
  it("decodes well-formed claim", () => {
    const claim = {
      domain: "purupuru.awareness.genesis-stone",
      version: 1,
      cluster: 0 as const, // devnet
      programId: "ProgramId11111111111111111111111111111111",
      wallet: "Wallet1111111111111111111111111111111111111" as ClaimMessage["wallet"],
      element: 2, // FIRE
      weather: 5, // WATER
      quizStateHash: "a".repeat(64) as ClaimMessage["quizStateHash"],
      issuedAt: 1700000000,
      expiresAt: 1700000300,
      nonce: "b".repeat(32) as ClaimMessage["nonce"],
    };
    const decoded = S.decodeUnknownSync(ClaimMessage)(claim);
    expect(decoded.element).toBe(2);
  });

  it("rejects element out of range (must be 1-5 byte form)", () => {
    expect(() =>
      S.decodeUnknownSync(ClaimMessage)({
        domain: "purupuru.awareness.genesis-stone",
        version: 1,
        cluster: 0,
        programId: "x",
        wallet: "y",
        element: 0, // invalid
        weather: 1,
        quizStateHash: "a".repeat(64),
        issuedAt: 1,
        expiresAt: 2,
        nonce: "b".repeat(32),
      }),
    ).toThrow();
  });

  it("rejects cross-cluster (cluster must be 0 or 1)", () => {
    expect(() =>
      S.decodeUnknownSync(ClaimMessage)({
        domain: "purupuru.awareness.genesis-stone",
        version: 1,
        cluster: 2 as never, // invalid
        programId: "x",
        wallet: "y",
        element: 1,
        weather: 1,
        quizStateHash: "a".repeat(64),
        issuedAt: 1,
        expiresAt: 2,
        nonce: "b".repeat(32),
      }),
    ).toThrow();
  });

  it("rejects malformed quizStateHash (must be 64 hex chars)", () => {
    expect(() =>
      S.decodeUnknownSync(ClaimMessage)({
        domain: "purupuru.awareness.genesis-stone",
        version: 1,
        cluster: 0,
        programId: "x",
        wallet: "y",
        element: 1,
        weather: 1,
        quizStateHash: "tooshort", // wrong length
        issuedAt: 1,
        expiresAt: 2,
        nonce: "b".repeat(32),
      }),
    ).toThrow();
  });

  it("buildClaimMessage produces TTL-bounded claim", () => {
    const claim = buildClaimMessage({
      programId: "TestProgramId111111111111111111111111111",
      wallet: "TestWallet11111111111111111111111111111111" as ClaimMessage["wallet"],
      element: "FIRE",
      weather: "WATER",
      quizStateHash: "f".repeat(64) as ClaimMessage["quizStateHash"],
      cluster: 0,
      ttlSeconds: 300,
      nonce: "n".repeat(32) as ClaimMessage["nonce"],
    });
    expect(claim.element).toBe(2); // FIRE = 2
    expect(claim.weather).toBe(5); // WATER = 5
    expect(claim.expiresAt - claim.issuedAt).toBe(300);
    expect(claim.domain).toBe("purupuru.awareness.genesis-stone");
  });
});

describe("ClaimMessage · 98-byte canonical encoding (S2-T3)", () => {
  it("encodes to exactly 98 bytes", () => {
    const bytes = encodeClaimMessage(makeClaim());
    expect(bytes.length).toBe(CLAIM_MESSAGE_SIGNED_BYTES);
    expect(bytes.length).toBe(98);
  });

  it("layout: [0..32] are wallet pubkey raw bytes", () => {
    const walletRaw = randomBytes(32);
    const claim = makeClaim({
      wallet: bs58.encode(walletRaw) as ClaimMessage["wallet"],
    });
    const bytes = encodeClaimMessage(claim);
    expect(Buffer.from(bytes.subarray(0, 32))).toEqual(Buffer.from(walletRaw));
  });

  it("layout: [32] is element byte (1..5)", () => {
    for (const e of [1, 2, 3, 4, 5]) {
      const bytes = encodeClaimMessage(makeClaim({ element: e }));
      expect(bytes[32]).toBe(e);
    }
  });

  it("layout: [33] is weather byte (1..5)", () => {
    for (const w of [1, 2, 3, 4, 5]) {
      const bytes = encodeClaimMessage(makeClaim({ weather: w }));
      expect(bytes[33]).toBe(w);
    }
  });

  it("layout: [34..66] are quizStateHash raw bytes from hex", () => {
    const hashHex = "deadbeef".repeat(8) as ClaimMessage["quizStateHash"]; // 64 hex chars
    const bytes = encodeClaimMessage(makeClaim({ quizStateHash: hashHex }));
    expect(Buffer.from(bytes.subarray(34, 66))).toEqual(Buffer.from(hashHex, "hex"));
  });

  it("layout: [66..74] are issuedAt as i64 LE", () => {
    const bytes = encodeClaimMessage(makeClaim({ issuedAt: 1700000000 }));
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getBigInt64(66, true)).toBe(BigInt(1700000000));
  });

  it("layout: [74..82] are expiresAt as i64 LE", () => {
    const bytes = encodeClaimMessage(makeClaim({ expiresAt: 1700000300 }));
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getBigInt64(74, true)).toBe(BigInt(1700000300));
  });

  it("layout: [82..98] are nonce raw bytes from hex", () => {
    const nonceHex = "cafebabe".repeat(4) as ClaimMessage["nonce"]; // 32 hex chars
    const bytes = encodeClaimMessage(makeClaim({ nonce: nonceHex }));
    expect(Buffer.from(bytes.subarray(82, 98))).toEqual(Buffer.from(nonceHex, "hex"));
  });

  it("deterministic: same input produces byte-identical output", () => {
    const claim = makeClaim();
    const a = encodeClaimMessage(claim);
    const b = encodeClaimMessage(claim);
    expect(Buffer.from(a)).toEqual(Buffer.from(b));
  });

  it("rejects wallet that decodes to wrong byte length", () => {
    // bs58 of 31 bytes · valid bs58 string but not a Solana pubkey
    const shortWallet = bs58.encode(randomBytes(31)) as ClaimMessage["wallet"];
    expect(() => encodeClaimMessage(makeClaim({ wallet: shortWallet }))).toThrow(
      /wallet pubkey must decode to 32 bytes/,
    );
  });

  it("rejects quizStateHash with wrong hex length", () => {
    expect(() =>
      encodeClaimMessage(
        makeClaim({ quizStateHash: "ab".repeat(20) as ClaimMessage["quizStateHash"] }),
      ),
    ).toThrow(/quizStateHash must be 64 hex chars/);
  });

  it("rejects quizStateHash with non-hex chars (decodes short)", () => {
    // 64 chars but contains 'z' (non-hex) · Buffer.from silently truncates
    const bad = "z".repeat(64) as ClaimMessage["quizStateHash"];
    expect(() => encodeClaimMessage(makeClaim({ quizStateHash: bad }))).toThrow(
      /quizStateHash must decode to 32 bytes/,
    );
  });

  it("rejects nonce with wrong hex length", () => {
    expect(() =>
      encodeClaimMessage(makeClaim({ nonce: "ab".repeat(10) as ClaimMessage["nonce"] })),
    ).toThrow(/nonce must be 32 hex chars/);
  });

  it("rejects element out of 1..5 range", () => {
    expect(() => encodeClaimMessage(makeClaim({ element: 0 }))).toThrow(/element/);
    expect(() => encodeClaimMessage(makeClaim({ element: 6 }))).toThrow(/element/);
  });

  it("rejects weather out of 1..5 range", () => {
    expect(() => encodeClaimMessage(makeClaim({ weather: 0 }))).toThrow(/weather/);
    expect(() => encodeClaimMessage(makeClaim({ weather: 6 }))).toThrow(/weather/);
  });

  it("changing any single field changes the encoded bytes", () => {
    const base = encodeClaimMessage(makeClaim({ element: 2, weather: 5 }));
    const mutEl = encodeClaimMessage(makeClaim({ element: 3, weather: 5 }));
    const mutW = encodeClaimMessage(makeClaim({ element: 2, weather: 4 }));
    expect(Buffer.from(mutEl)).not.toEqual(Buffer.from(base));
    expect(Buffer.from(mutW)).not.toEqual(Buffer.from(base));
  });
});

describe("ClaimMessage · ed25519 sign/verify (S2-T3)", () => {
  it("sign+verify roundtrip with matching keypair returns true", () => {
    const { secret, pubkey } = makeSigner();
    const signed = signClaimMessage(makeClaim(), secret);
    expect(signed.messageBytes.length).toBe(98);
    expect(signed.signature.length).toBe(64);
    expect(signed.signerPubkey.length).toBe(32);
    expect(Buffer.from(signed.signerPubkey)).toEqual(Buffer.from(pubkey));
    expect(verifyClaimSignature(signed.messageBytes, signed.signature, signed.signerPubkey)).toBe(
      true,
    );
  });

  it("verify rejects modified message bytes (single bit flip)", () => {
    const { secret } = makeSigner();
    const signed = signClaimMessage(makeClaim(), secret);
    const tampered = new Uint8Array(signed.messageBytes);
    tampered[0] ^= 0x01; // flip 1 bit in wallet pubkey
    expect(verifyClaimSignature(tampered, signed.signature, signed.signerPubkey)).toBe(false);
  });

  it("verify rejects modified signature (single bit flip)", () => {
    const { secret } = makeSigner();
    const signed = signClaimMessage(makeClaim(), secret);
    const tampered = new Uint8Array(signed.signature);
    tampered[0] ^= 0x01;
    expect(verifyClaimSignature(signed.messageBytes, tampered, signed.signerPubkey)).toBe(false);
  });

  it("verify rejects wrong signer pubkey (bound to different secret)", () => {
    const { secret } = makeSigner();
    const wrongSigner = makeSigner();
    const signed = signClaimMessage(makeClaim(), secret);
    expect(verifyClaimSignature(signed.messageBytes, signed.signature, wrongSigner.pubkey)).toBe(
      false,
    );
  });

  it("different secret produces different signature for same message", () => {
    const claim = makeClaim();
    const a = signClaimMessage(claim, makeSigner().secret);
    const b = signClaimMessage(claim, makeSigner().secret);
    // Same message bytes (deterministic encoding)
    expect(Buffer.from(a.messageBytes)).toEqual(Buffer.from(b.messageBytes));
    // Different signatures (ed25519 is deterministic but bound to different keys)
    expect(Buffer.from(a.signature)).not.toEqual(Buffer.from(b.signature));
  });

  it("ed25519 is deterministic: same secret + same message → same signature", () => {
    const claim = makeClaim();
    const { secret } = makeSigner();
    const a = signClaimMessage(claim, secret);
    const b = signClaimMessage(claim, secret);
    expect(Buffer.from(a.signature)).toEqual(Buffer.from(b.signature));
  });

  it("rejects secret of wrong length", () => {
    expect(() => signClaimMessage(makeClaim(), randomBytes(32))).toThrow(/must be 64 bytes/);
    expect(() => signClaimMessage(makeClaim(), randomBytes(128))).toThrow(/must be 64 bytes/);
  });

  it("verifyClaimSignature returns false on length-mismatched inputs (defense)", () => {
    const { secret, pubkey } = makeSigner();
    const signed = signClaimMessage(makeClaim(), secret);

    // Wrong-length message bytes
    expect(verifyClaimSignature(new Uint8Array(50), signed.signature, signed.signerPubkey)).toBe(
      false,
    );
    // Wrong-length signature
    expect(verifyClaimSignature(signed.messageBytes, new Uint8Array(63), signed.signerPubkey)).toBe(
      false,
    );
    // Wrong-length pubkey
    expect(verifyClaimSignature(signed.messageBytes, signed.signature, new Uint8Array(31))).toBe(
      false,
    );
    // Sanity: matched lengths still verify
    expect(verifyClaimSignature(signed.messageBytes, signed.signature, pubkey)).toBe(true);
  });

  it("end-to-end: claim-signer secret from .env.local format produces verifiable sig", () => {
    // Mirrors the production path: bs58-decoded 64-byte secret → sign → verify.
    // This is the exact contract sprint-3 API routes will use.
    const seed = randomBytes(32);
    const kp = nacl.sign.keyPair.fromSeed(seed);
    const bs58Secret = bs58.encode(kp.secretKey); // simulates .env.local CLAIM_SIGNER_SECRET_BS58

    const decodedSecret = bs58.decode(bs58Secret);
    expect(decodedSecret.length).toBe(64);

    const claim = makeClaim();
    const signed = signClaimMessage(claim, decodedSecret);
    expect(verifyClaimSignature(signed.messageBytes, signed.signature, signed.signerPubkey)).toBe(
      true,
    );
    // Signer pubkey matches the seed-derived pubkey
    expect(Buffer.from(signed.signerPubkey)).toEqual(Buffer.from(kp.publicKey));
  });
});
