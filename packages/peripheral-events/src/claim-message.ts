// ClaimMessage · server-signed payload for genesis-stone mint
// SDD r2 §3.3 · structured payload + ed25519 via Solana instructions sysvar
//
// Anchor program reads instructions sysvar at index N-1, verifies prior
// instruction is Ed25519Program with claim-signer pubkey + canonical
// ClaimMessage bytes. Anchor decodes message and validates fields.
//
// Nonce store: Vercel KV with NX EX 300 · single-region iad1 · fail-closed.

import bs58 from "bs58";
import { Schema as S } from "effect";
import nacl from "tweetnacl";

import { Element, SolanaPubkey } from "./world-event";

// Cluster discriminator · prevents cross-cluster signature replay.
export const SolanaCluster = S.Literal(0, 1); // 0=devnet · 1=mainnet
export type SolanaCluster = S.Schema.Type<typeof SolanaCluster>;

// 32-byte hex digest (sha256 of canonical quiz state).
export const QuizStateHash = S.String.pipe(S.length(64), S.brand("QuizStateHash"));
export type QuizStateHash = S.Schema.Type<typeof QuizStateHash>;

// 16-byte hex nonce · UUID v4 collapsed to hex.
export const ClaimNonce = S.String.pipe(S.length(32), S.brand("ClaimNonce"));
export type ClaimNonce = S.Schema.Type<typeof ClaimNonce>;

// Element-as-byte mapping for on-chain ClaimMessage encoding:
//   1=Wood · 2=Fire · 3=Earth · 4=Metal · 5=Water
export const elementToByte = (e: Element): number => {
  switch (e) {
    case "WOOD":
      return 1;
    case "FIRE":
      return 2;
    case "EARTH":
      return 3;
    case "METAL":
      return 4;
    case "WATER":
      return 5;
  }
};

export const byteToElement = (b: number): Element => {
  switch (b) {
    case 1:
      return "WOOD";
    case 2:
      return "FIRE";
    case 3:
      return "EARTH";
    case 4:
      return "METAL";
    case 5:
      return "WATER";
    default:
      throw new Error(`Invalid element byte: ${b}`);
  }
};

// Canonical signed payload · matches Rust struct in programs/purupuru-anchor.
//
// SECURITY · per flatline r2 SKP-004 + r3 SKP-002:
//   - domain: prevents cross-application signature reuse
//   - version: schema version · forward-compatible
//   - cluster: prevents cross-cluster replay
//   - programId: prevents cross-program replay
//   - wallet: binds claim to specific authority
//   - element + weather: cosmic-weather imprint at mint time
//   - quizStateHash: links claim to validated quiz answers
//   - issuedAt + expiresAt: 5-minute server-side TTL window
//   - nonce: server-tracked · Vercel KV NX EX 300 · prevents replay
export const ClaimMessage = S.Struct({
  domain: S.String, // "purupuru.awareness.genesis-stone"
  version: S.Number.pipe(S.between(0, 255)),
  cluster: SolanaCluster,
  programId: S.String, // base58 pubkey
  wallet: SolanaPubkey,
  element: S.Number.pipe(S.between(1, 5)), // byte form per elementToByte
  weather: S.Number.pipe(S.between(1, 5)),
  quizStateHash: QuizStateHash,
  issuedAt: S.Number, // unix seconds
  expiresAt: S.Number,
  nonce: ClaimNonce,
});
export type ClaimMessage = S.Schema.Type<typeof ClaimMessage>;

// Construct a fresh ClaimMessage at mint time · server-side helper.
export const buildClaimMessage = (params: {
  programId: string;
  wallet: SolanaPubkey;
  element: Element;
  weather: Element;
  quizStateHash: QuizStateHash;
  cluster: SolanaCluster;
  ttlSeconds?: number;
  nonce: ClaimNonce;
}): ClaimMessage => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const ttl = params.ttlSeconds ?? 300;
  return {
    domain: "purupuru.awareness.genesis-stone",
    version: 1,
    cluster: params.cluster,
    programId: params.programId,
    wallet: params.wallet,
    element: elementToByte(params.element),
    weather: elementToByte(params.weather),
    quizStateHash: params.quizStateHash,
    issuedAt,
    expiresAt: issuedAt + ttl,
    nonce: params.nonce,
  };
};

// ---------------------------------------------------------------------------
// Canonical signed-bytes layout · 98-byte 7-field projection of ClaimMessage
// ---------------------------------------------------------------------------
//
// THIS LAYOUT MUST EXACTLY MATCH the reconstitution in
// programs/purupuru-anchor/programs/purupuru-anchor/src/lib.rs
// (claim_genesis_stone instruction). Drift = silent forgery vulnerability:
// Ed25519Program would verify the off-chain bytes fine, but the on-chain
// reconstitution would produce different bytes and reject with
// ErrorCode::MessageMismatch. Test catches this in invariant suite.
//
//   offset  size  field
//   ------  ----  -------------------------------------------------
//   [ 0..32] 32B  wallet pubkey (raw bytes from bs58.decode · 32B)
//   [32..33]  1B  element byte (1=Wood · 2=Fire · 3=Earth · 4=Metal · 5=Water)
//   [33..34]  1B  weather byte (1..5 · same element scale per SDD §3.3)
//   [34..66] 32B  quiz_state_hash (raw bytes from hex · 32B sha256 digest)
//   [66..74]  8B  issued_at (i64 little-endian · unix seconds)
//   [74..82]  8B  expires_at (i64 little-endian · unix seconds)
//   [82..98] 16B  nonce (raw bytes from hex · UUID v4 collapsed)
//   ============= 98 bytes total
//
// The OTHER four ClaimMessage fields (domain, version, cluster, programId)
// are NOT in the signed bytes for v0. Domain separation is enforced ON-CHAIN
// via Anchor program constants (declare_id!() pins program · hardcoded
// CLAIM_SIGNER_PUBKEY pins signer · cluster is implicitly devnet at deploy
// time · domain is implicit in the dedicated CLAIM_SIGNER key). If
// claim-signer is ever shared across programs/clusters, upgrade this
// layout to include those fields BEFORE doing so.
export const CLAIM_MESSAGE_SIGNED_BYTES = 98 as const;

const OFFSET_WALLET = 0;
const OFFSET_ELEMENT = 32;
const OFFSET_WEATHER = 33;
const OFFSET_QUIZ_HASH = 34;
const OFFSET_ISSUED_AT = 66;
const OFFSET_EXPIRES_AT = 74;
const OFFSET_NONCE = 82;

const PUBKEY_BYTES = 32;
const QUIZ_HASH_BYTES = 32;
const NONCE_BYTES = 16;
const ED25519_SECRET_BYTES = 64;
const ED25519_SIG_BYTES = 64;

// Encode a ClaimMessage to its 98-byte canonical signed representation.
// Throws on malformed inputs (rejects rather than silently truncating).
export function encodeClaimMessage(msg: ClaimMessage): Uint8Array {
  const buf = new Uint8Array(CLAIM_MESSAGE_SIGNED_BYTES);

  // [0..32] wallet pubkey
  const walletBytes = bs58.decode(msg.wallet);
  if (walletBytes.length !== PUBKEY_BYTES) {
    throw new Error(
      `wallet pubkey must decode to ${PUBKEY_BYTES} bytes, got ${walletBytes.length}`,
    );
  }
  buf.set(walletBytes, OFFSET_WALLET);

  // [32] element byte
  if (msg.element < 1 || msg.element > 5) {
    throw new Error(`element byte must be in 1..5, got ${msg.element}`);
  }
  buf[OFFSET_ELEMENT] = msg.element;

  // [33] weather byte
  if (msg.weather < 1 || msg.weather > 5) {
    throw new Error(`weather byte must be in 1..5, got ${msg.weather}`);
  }
  buf[OFFSET_WEATHER] = msg.weather;

  // [34..66] quiz_state_hash · 32 bytes from hex
  if (msg.quizStateHash.length !== QUIZ_HASH_BYTES * 2) {
    throw new Error(
      `quizStateHash must be ${QUIZ_HASH_BYTES * 2} hex chars, got ${msg.quizStateHash.length}`,
    );
  }
  const hashBytes = Buffer.from(msg.quizStateHash, "hex");
  if (hashBytes.length !== QUIZ_HASH_BYTES) {
    throw new Error(`quizStateHash must decode to ${QUIZ_HASH_BYTES} bytes (non-hex chars?)`);
  }
  buf.set(hashBytes, OFFSET_QUIZ_HASH);

  // [66..74] issued_at · i64 LE
  // [74..82] expires_at · i64 LE
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  dv.setBigInt64(OFFSET_ISSUED_AT, BigInt(msg.issuedAt), true);
  dv.setBigInt64(OFFSET_EXPIRES_AT, BigInt(msg.expiresAt), true);

  // [82..98] nonce · 16 bytes from hex
  if (msg.nonce.length !== NONCE_BYTES * 2) {
    throw new Error(`nonce must be ${NONCE_BYTES * 2} hex chars, got ${msg.nonce.length}`);
  }
  const nonceBytes = Buffer.from(msg.nonce, "hex");
  if (nonceBytes.length !== NONCE_BYTES) {
    throw new Error(`nonce must decode to ${NONCE_BYTES} bytes (non-hex chars?)`);
  }
  buf.set(nonceBytes, OFFSET_NONCE);

  return buf;
}

// Output of signClaimMessage · the three pieces an Ed25519Program instruction
// requires (off-chain assembly is sprint-3 work · this just produces the trio).
export interface SignedClaimMessage {
  /** 98-byte canonical encoding · MUST match anchor program reconstitution */
  messageBytes: Uint8Array;
  /** 64-byte ed25519 detached signature */
  signature: Uint8Array;
  /** 32-byte ed25519 public key for the claim-signer · used by anchor's signer check */
  signerPubkey: Uint8Array;
}

// Sign a ClaimMessage with the claim-signer secret · returns trio for
// downstream Ed25519Program instruction assembly.
//
// secret: 64-byte ed25519 secret key (per Solana keypair JSON format ·
// bytes [0..32]=seed · bytes [32..64]=public key). Caller decodes from
// CLAIM_SIGNER_SECRET_BS58 env var.
export function signClaimMessage(msg: ClaimMessage, secret: Uint8Array): SignedClaimMessage {
  if (secret.length !== ED25519_SECRET_BYTES) {
    throw new Error(
      `claim-signer secret must be ${ED25519_SECRET_BYTES} bytes, got ${secret.length}`,
    );
  }
  const messageBytes = encodeClaimMessage(msg);
  const keypair = nacl.sign.keyPair.fromSecretKey(secret);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return {
    messageBytes,
    signature,
    signerPubkey: keypair.publicKey,
  };
}

// Verify a ClaimMessage signature · used by tests + as a defensive check
// before submitting to chain. Returns false on length mismatches rather
// than throwing (treat as untrusted input).
export function verifyClaimSignature(
  messageBytes: Uint8Array,
  signature: Uint8Array,
  signerPubkey: Uint8Array,
): boolean {
  if (messageBytes.length !== CLAIM_MESSAGE_SIGNED_BYTES) return false;
  if (signature.length !== ED25519_SIG_BYTES) return false;
  if (signerPubkey.length !== PUBKEY_BYTES) return false;
  return nacl.sign.detached.verify(messageBytes, signature, signerPubkey);
}
