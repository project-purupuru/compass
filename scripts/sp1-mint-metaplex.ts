#!/usr/bin/env tsx
/**
 * Sp1 · Metaplex Phantom Devnet Visibility Spike
 *
 * GOAL · prove (or disprove) that minting a Metaplex Token Metadata NFT on devnet
 *        results in a visible NFT in the operator's Phantom wallet collectibles tab.
 *
 * BINARY OUTCOME · if Phantom shows the NFT, FR-3 (genesis stone mint) ships as v0
 *                  spec'd. If not, we revert to PDA-only "claim record" semantics
 *                  and swap deck language (per pre-staged S1-T11 fallback).
 *
 * USAGE · pnpm exec tsx scripts/sp1-mint-metaplex.ts <PHANTOM_DEVNET_PUBKEY>
 *
 * ─────────────────────────────────────────────────────────────────────────
 *
 * EDUCATIONAL · what this script actually does (operator + zerker handoff)
 *
 * A Metaplex NFT is THREE on-chain accounts working together:
 *   1. SPL Token Mint    · supply=1, decimals=0 (the "non-fungible" part)
 *   2. Metadata Account  · PDA derived from mint · holds name/symbol/uri/creators
 *   3. Master Edition    · PDA derived from mint · enforces the supply-1 invariant
 *
 * The metadata `uri` field points to a JSON document (we host on GitHub raw).
 * Phantom's collectibles tab queries `getProgramAccounts(METAPLEX_PROGRAM_ID)` to
 * find metadata accounts owned by your wallet, then fetches the URI to render
 * name + image.
 *
 * For zerker's indexer (S3-T9):
 *   The same pattern but listening for `StoneClaimed` events emitted by our
 *   anchor program (S2-T1). Each event payload mirrors this metadata structure.
 *
 * ─────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  type PublicKey as UmiPublicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";

// ── 1. Configuration ─────────────────────────────────────────────────

const DEVNET_RPC = "https://api.devnet.solana.com";

// Metadata URI · GitHub raw URL pointing to our committed metadata JSON.
// (For SPIKE: change branch to `main` after this script lands on main.)
const METADATA_URI =
  "https://raw.githubusercontent.com/project-purupuru/purupuru-ttrpg/feat/awareness-layer-spine/fixtures/spikes/sp1-metadata.json";

// Solana CLI default keypair location · we use this as the mint authority + payer.
const DEFAULT_KEYPAIR_PATH = resolve(homedir(), ".config/solana/id.json");
const KEYPAIR_PATH = process.env.SOLANA_PAYER_KEYPAIR ?? DEFAULT_KEYPAIR_PATH;

// ── 2. Argument parsing ──────────────────────────────────────────────

const recipientPubkeyArg = process.argv[2];

if (!recipientPubkeyArg) {
  console.error(`
Usage: pnpm exec tsx scripts/sp1-mint-metaplex.ts <PHANTOM_DEVNET_PUBKEY>

Where to find your Phantom devnet pubkey:
  1. Open Phantom → Settings → Developer Settings → Testnet Mode → enable
  2. Switch to "Devnet" in the network selector at top of Phantom
  3. Click wallet address at top → it copies your pubkey
  4. Paste it here as the script argument

Optional env:
  SOLANA_PAYER_KEYPAIR=/path/to/keypair.json  (defaults to ${DEFAULT_KEYPAIR_PATH})
`);
  process.exit(1);
}

if (!existsSync(KEYPAIR_PATH)) {
  console.error(`
❌ Payer keypair not found at: ${KEYPAIR_PATH}

Run one of:
  solana-keygen new                                 # generate new default keypair
  solana airdrop 1                                  # fund it from devnet faucet
  export SOLANA_PAYER_KEYPAIR=/path/to/keypair.json # or point to existing
`);
  process.exit(1);
}

// ── 3. Set up Umi (Metaplex's modern SDK runtime) ────────────────────

console.log("🔧 Setting up Umi...");

const umi = createUmi(DEVNET_RPC);
umi.use(mplTokenMetadata()); // registers Token Metadata program + helpers

// Load the payer keypair · this account pays tx fees + becomes the mint authority.
// (Sprint-3 · S3-T1 swaps to a sponsored-payer keypair · for SPIKE we use the local one.)
const keypairBytes = JSON.parse(readFileSync(KEYPAIR_PATH, "utf-8")) as number[];
const payerKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(keypairBytes));
umi.use(keypairIdentity(payerKeypair));

const payerPubkey: UmiPublicKey = umi.identity.publicKey;
console.log(`   Payer pubkey: ${payerPubkey.toString()}`);

// Recipient · operator's Phantom devnet wallet.
let recipient: UmiPublicKey;
try {
  recipient = publicKey(recipientPubkeyArg);
} catch {
  console.error(`❌ Invalid Solana pubkey: ${recipientPubkeyArg}`);
  process.exit(1);
}
console.log(`   Recipient: ${recipient.toString()}`);

// Wrap async work in main() so tsx's CJS default doesn't choke on top-level await.
async function main() {
  // ── 4. Pre-flight balance check ──────────────────────────────────────

  const balanceLamports = await umi.rpc.getBalance(payerPubkey);
  const balanceSol = Number(balanceLamports.basisPoints) / 1e9;
  console.log(`   Payer balance: ${balanceSol.toFixed(4)} SOL`);

  if (balanceSol < 0.01) {
    console.error(`
❌ Payer balance too low (need ≥0.01 SOL for mint)

Run: solana airdrop 1
`);
    process.exit(1);
  }

  // ── 5. Generate the mint keypair (fresh per run) ─────────────────────

  // In Metaplex, the mint is itself a keypair · generated fresh for each NFT.
  // The mint pubkey becomes the unique on-chain identity of this NFT.
  const mintSigner = generateSigner(umi);
  console.log(`\n🪨 Mint pubkey (this becomes the NFT's on-chain ID):`);
  console.log(`   ${mintSigner.publicKey.toString()}`);

  // ── 6. Build + send the createNft transaction ────────────────────────

  console.log(`\n🌬 Sending createNft transaction to devnet...`);
  console.log(`   Metadata URI: ${METADATA_URI}`);

  try {
    const result = await createNft(umi, {
      mint: mintSigner,
      name: "Genesis Stone · Fire",
      symbol: "PGS",
      uri: METADATA_URI,
      sellerFeeBasisPoints: percentAmount(0), // 0% royalty · this isn't a marketplace flow
      tokenOwner: recipient, // ← the NFT lands in operator's Phantom
      isCollection: false,
    }).sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });

    // Convert signature bytes → base58 string for explorer link.
    // Umi returns signature as Uint8Array · we encode to base58 for the explorer URL.
    const [signatureString] = base58.deserialize(result.signature);

    console.log(`\n✅ MINT CONFIRMED`);
    console.log(`   Tx signature: ${signatureString}`);
    console.log(
      `   Solana Explorer: https://explorer.solana.com/tx/${signatureString}?cluster=devnet`,
    );
    console.log(
      `   Token Explorer:  https://explorer.solana.com/address/${mintSigner.publicKey.toString()}?cluster=devnet`,
    );
  } catch (err) {
    console.error(`\n❌ MINT FAILED`);
    console.error(err);
    process.exit(1);
  }

  // ── 7. Verification instructions ─────────────────────────────────────

  console.log(`
═══════════════════════════════════════════════════════════════════════
  VERIFY · Phantom collectibles tab
═══════════════════════════════════════════════════════════════════════

  1. Open Phantom · ensure DEVNET mode is selected
  2. Tap the Collectibles tab (NOT tokens · this is for NFTs)
  3. Look for "Genesis Stone · Fire" with a Fire-element puruhani image

  ✅ NFT visible w/ image  →  Sp1 PASS · update fixtures/spikes/README.md
  ❌ NFT not visible        →  Sp1 FAIL · check Phantom devnet mode + RPC + scroll
  ❌ NFT visible no image   →  metadata URI fetch issue · check the URI is reachable

  Phantom may take 30-60 seconds to index the new NFT after mint confirms.

  If NFT appears with PLACEHOLDER image (gray box):
  → Phantom couldn't fetch the metadata URI or image. Check:
     curl -I "${METADATA_URI}"

═══════════════════════════════════════════════════════════════════════
`);
}

// Run main · catch + log failures so we get clean stack traces.
main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
