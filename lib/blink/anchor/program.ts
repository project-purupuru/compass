// Typed Anchor program client for purupuru_anchor
//
// Vendored IDL + generated types (sibling files) are the source for compile-time
// type-checking + runtime instruction encoding. The on-chain program at the
// declared address is upgrade-frozen post-deploy, so the IDL is stable.

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

import idl from "./purupuru_anchor.idl.json";
import type { PurupuruAnchor } from "./purupuru_anchor.types";

// Minimal wallet shim · AnchorProvider needs `publicKey` + sign methods. We
// don't actually invoke the provider's send path (instruction encoding only),
// but the constructor requires a wallet-shaped object. Avoids importing
// anchor's NodeWallet which has shifted across ESM builds.
class KeypairWallet {
  constructor(public readonly payer: Keypair) {}
  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    } else {
      tx.sign([this.payer]);
    }
    return tx;
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map((tx) => this.signTransaction(tx)));
  }
}

export const PURUPURU_PROGRAM_ID = new PublicKey("7u27WmTz2hZHvvhL89XcSCY3eFhxEfHjUN5MjzMY6v38");

// Token Metadata + Sysvar + SPL Token program IDs · pinned per lib.rs Accounts struct.
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);
export const SYSVAR_INSTRUCTIONS_PUBKEY = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111",
);
export const SPL_TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Build a typed Program client. The provider's wallet is used only for
// instruction encoding · we partial-sign separately in build-claim-tx.
export function getPurupuruProgram(
  connection: Connection,
  payer: Keypair,
): Program<PurupuruAnchor> {
  const wallet = new KeypairWallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<PurupuruAnchor>(idl as unknown as PurupuruAnchor, provider);
}

// Derive Metaplex metadata PDA · seeds = [b"metadata", program_id, mint]
export function deriveMetadataPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

// Derive Metaplex master-edition PDA · seeds = [b"metadata", program_id, mint, b"edition"]
export function deriveMasterEditionPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}
