#!/usr/bin/env tsx
/**
 * S2-T1.5 · Bootstrap the Genesis Stones Collection NFT (ONE-TIME)
 *
 * Mints the parent Collection NFT for purupuru's Genesis Stones · child stones
 * minted by claim_genesis_stone (S2-T1) reference this mint via the collection
 * field. Phantom groups child NFTs under the collection in the collectibles tab
 * (with a yellow unverified badge until verifyCollectionV1 fires · post-hackathon).
 *
 * USAGE · pnpm exec tsx scripts/bootstrap-collection.ts
 *
 * After running:
 *   1. Copy the printed mint pubkey
 *   2. Paste into .env.local as GENESIS_STONE_COLLECTION_MINT=...
 *   3. Paste into programs/purupuru-anchor/.../src/lib.rs as COLLECTION_MINT_PUBKEY const
 *   4. Rebuild + redeploy anchor
 *
 * What "collection NFT" means in Solana / Metaplex:
 *   - It's just a regular NFT with metadata.collection_details = { size } set
 *     (this is what `isCollection: true` does · sets the marker on metadata)
 *   - Each child stone references this NFT's mint pubkey in its OWN
 *     metadata.collection = { key: <this mint>, verified: false }
 *   - Phantom + Magic Eden + Tensor read collection.key to group displays
 *   - verified=true requires the collection-update-authority to call
 *     verifyCollectionV1 in a separate tx (we skip for hackathon · yellow badge)
 *
 * Differences from sp1-mint-metaplex.ts:
 *   - isCollection: true (THE key flag)
 *   - tokenOwner = umi.identity (collection NFT stays with minter · we control it)
 *   - Different name + metadata URI (collection-level, not per-element)
 *   - No recipient arg (collection lands in the script-runner's wallet)
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  type PublicKey as UmiPublicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";

// ── Configuration ────────────────────────────────────────────────────

const DEVNET_RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// Metadata URI · GitHub raw URL pointing to fixtures/collection-metadata.json.
// (Branch will be `main` after this lands · for now, the feature branch.)
const METADATA_URI =
  "https://raw.githubusercontent.com/project-purupuru/purupuru-ttrpg/feat/awareness-layer-spine/fixtures/collection-metadata.json";

// Solana CLI default keypair location · this account pays + becomes
// collection update authority. For sprint-2 we use the operator's id.json
// (sponsored-payer is reserved for runtime mints, not bootstrapping).
const DEFAULT_KEYPAIR_PATH = resolve(homedir(), ".config/solana/id.json");
const KEYPAIR_PATH = process.env.SOLANA_PAYER_KEYPAIR ?? DEFAULT_KEYPAIR_PATH;

// ── Pre-flight checks ────────────────────────────────────────────────

if (!existsSync(KEYPAIR_PATH)) {
  console.error(`
❌ Payer keypair not found at: ${KEYPAIR_PATH}

Either:
  - Generate with:    solana-keygen new
  - Or set env:       export SOLANA_PAYER_KEYPAIR=/path/to/keypair.json
`);
  process.exit(1);
}

// ── Set up Umi (Metaplex modern SDK runtime) ─────────────────────────

console.log(`🔧 Setting up Umi (RPC: ${DEVNET_RPC})...`);

const umi = createUmi(DEVNET_RPC);
umi.use(mplTokenMetadata());

const keypairBytes = JSON.parse(readFileSync(KEYPAIR_PATH, "utf-8")) as number[];
const payerKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(keypairBytes));
umi.use(keypairIdentity(payerKeypair));

const payerPubkey: UmiPublicKey = umi.identity.publicKey;
console.log(`   Payer / collection authority: ${payerPubkey.toString()}`);

// ── Wrap in main() for tsx CJS ───────────────────────────────────────

async function main() {
  const balanceLamports = await umi.rpc.getBalance(payerPubkey);
  const balanceSol = Number(balanceLamports.basisPoints) / 1e9;
  console.log(`   Payer balance: ${balanceSol.toFixed(4)} SOL`);

  // Collection NFT bootstrap is ~0.012 SOL · keep buffer
  if (balanceSol < 0.05) {
    console.error(`
❌ Payer balance too low (need ≥0.05 SOL · this is one-time mint)

Run: solana airdrop 1 --url devnet
`);
    process.exit(1);
  }

  // Generate fresh mint keypair · this becomes the collection's permanent identity
  const collectionMintSigner = generateSigner(umi);
  console.log(`\n🌳 Collection mint pubkey (PASTE THIS into env + anchor const):`);
  console.log(`   ${collectionMintSigner.publicKey.toString()}`);

  console.log(`\n🌬 Sending createNft (isCollection:true) to devnet...`);
  console.log(`   Metadata URI: ${METADATA_URI}`);

  try {
    const result = await createNft(umi, {
      mint: collectionMintSigner,
      name: "Genesis Stones",
      symbol: "PGS",
      uri: METADATA_URI,
      sellerFeeBasisPoints: percentAmount(0),
      isCollection: true, // ← THE difference from Sp1
      tokenOwner: umi.identity.publicKey, // collection stays with us
    }).sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });

    const [signatureString] = base58.deserialize(result.signature);

    console.log(`\n✅ COLLECTION MINT CONFIRMED`);
    console.log(`   Tx: ${signatureString}`);
    console.log(
      `   Tx Explorer:    https://explorer.solana.com/tx/${signatureString}?cluster=devnet`,
    );
    console.log(
      `   Token Explorer: https://explorer.solana.com/address/${collectionMintSigner.publicKey.toString()}?cluster=devnet`,
    );

    console.log(`
═══════════════════════════════════════════════════════════════════════
  NEXT STEPS · paste this pubkey in TWO places (drift = bug):
═══════════════════════════════════════════════════════════════════════

  1. .env.local
       GENESIS_STONE_COLLECTION_MINT=${collectionMintSigner.publicKey.toString()}

  2. programs/purupuru-anchor/programs/purupuru-anchor/src/lib.rs
       const COLLECTION_MINT_PUBKEY: Pubkey = pubkey!("${collectionMintSigner.publicKey.toString()}");

  Then rebuild + redeploy:
       anchor build && anchor deploy --provider.cluster devnet

═══════════════════════════════════════════════════════════════════════
`);
  } catch (err) {
    console.error(`\n❌ COLLECTION MINT FAILED`);
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
