// Build a partially-signed claim_genesis_stone transaction.
//
// Two-instruction tx assembled here:
//   [0] Ed25519Program · verifies the claim-signer's sig over 98-byte ClaimMessage
//   [1] claim_genesis_stone · reads instructions sysvar to confirm [0] verified the
//       expected (signer, message) tuple, then CPIs to Metaplex CreateV1
//
// Two server-held keypairs partial-sign here: sponsored-payer (fee_payer) + a
// fresh mint keypair (the new NFT's address). User wallet adds the third sig
// (authority) at submit time via Phantom.

import * as anchor from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection,
} from "@solana/web3.js";

import {
  buildClaimMessage,
  signClaimMessage,
  type ClaimMessage,
  type ClaimNonce,
  type Element,
  type QuizStateHash,
  type SolanaPubkey,
} from "@purupuru/peripheral-events";

import {
  deriveMasterEditionPda,
  deriveMetadataPda,
  getPurupuruProgram,
  PURUPURU_PROGRAM_ID,
  SPL_TOKEN_PROGRAM_ID,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TOKEN_METADATA_PROGRAM_ID,
} from "./program";

export interface BuildClaimTxParams {
  connection: Connection;
  sponsoredPayer: Keypair;
  claimSignerSecret: Uint8Array;
  authority: PublicKey;
  archetype: Element;
  weather: Element;
  quizStateHash: QuizStateHash;
  nonce: ClaimNonce;
  cluster: 0 | 1; // 0=devnet · 1=mainnet
}

export interface BuildClaimTxResult {
  base64Tx: string;
  mintPubkey: string;
  expiresAt: number;
  claimMessage: ClaimMessage;
}

export async function buildClaimGenesisStoneTx(
  params: BuildClaimTxParams,
): Promise<BuildClaimTxResult> {
  const {
    connection,
    sponsoredPayer,
    claimSignerSecret,
    authority,
    archetype,
    weather,
    quizStateHash,
    nonce,
    cluster,
  } = params;

  if (sponsoredPayer.publicKey.equals(authority)) {
    throw new Error("sponsored-payer pubkey must not equal authority wallet");
  }

  // 1. Build canonical ClaimMessage + sign off-chain.
  const claimMessage = buildClaimMessage({
    programId: PURUPURU_PROGRAM_ID.toBase58(),
    wallet: authority.toBase58() as SolanaPubkey,
    element: archetype,
    weather,
    quizStateHash,
    cluster,
    nonce,
  });
  const signed = signClaimMessage(claimMessage, claimSignerSecret);

  // 2. Build Ed25519Program ix · runtime verifies sig before our program runs.
  const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
    publicKey: signed.signerPubkey,
    message: Buffer.from(signed.messageBytes),
    signature: signed.signature,
  });

  // 3. Build claim_genesis_stone ix via Anchor's typed builder.
  const program = getPurupuruProgram(connection, sponsoredPayer);
  const mintKeypair = Keypair.generate();

  const claimIx = await program.methods
    .claimGenesisStone(
      authority,
      claimMessage.element,
      claimMessage.weather,
      Array.from(Buffer.from(quizStateHash, "hex")),
      new anchor.BN(claimMessage.issuedAt),
      new anchor.BN(claimMessage.expiresAt),
      Array.from(Buffer.from(nonce, "hex")),
    )
    .accounts({
      authority,
      sponsoredPayer: sponsoredPayer.publicKey,
      mint: mintKeypair.publicKey,
      metadata: deriveMetadataPda(mintKeypair.publicKey),
      masterEdition: deriveMasterEditionPda(mintKeypair.publicKey),
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: SPL_TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .instruction();

  // 4. Assemble tx · feePayer = sponsored-payer · fresh blockhash.
  const tx = new Transaction();
  tx.feePayer = sponsoredPayer.publicKey;
  tx.add(ed25519Ix);
  tx.add(claimIx);

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  // 5. Partial-sign with both server-held keypairs · authority slot stays empty.
  tx.partialSign(sponsoredPayer, mintKeypair);

  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  return {
    base64Tx: serialized.toString("base64"),
    mintPubkey: mintKeypair.publicKey.toBase58(),
    expiresAt: claimMessage.expiresAt,
    claimMessage,
  };
}
