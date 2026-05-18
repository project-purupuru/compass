/**
 * Sp3 · Sponsored-payer + partial-sign tx assembly
 *
 * Pattern proven by this spike (per SDD r2 §5.2):
 *
 *   1. Backend holds a "sponsored-payer" Solana keypair (env var · separate from claim-signer)
 *   2. Backend builds an unsigned tx with:
 *      - feePayer = sponsored-payer (so user pays no SOL)
 *      - mint instruction with user wallet as authority/owner
 *   3. Backend partial-signs as feePayer · serializes
 *   4. Returns base64-encoded tx in ActionPostResponse
 *   5. Client receives · wallet adds its own signature as authority · submits
 *   6. Solana runtime verifies BOTH sigs · executes
 *
 * Why this matters · gasless UX:
 *   - User holds wallet but may have 0 SOL (especially Phantom mobile / new users)
 *   - Without sponsored-payer · mint fails with "insufficient funds for tx fee"
 *   - With sponsored-payer · backend covers ~5000 lamports · user just signs
 *   - This is critical for the Blink judging UX (Eileen rubric · "frictionless mint")
 *
 * SECURITY notes:
 *   - sponsored-payer key MUST be a separate keypair from claim-signer
 *     (rotation independence · blast radius isolation)
 *   - sponsored-payer pays fees ONLY · never has authority over the mint
 *   - if sponsored-payer is drained · only fee-paying capability is lost · user funds safe
 *   - rate-limit + nonce-guard MUST gate mint endpoint (else attacker drains payer)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Load the sponsored-payer keypair from env.
 *
 * Expected formats (in priority order):
 *   1. Base58 secret key string (Phantom export format)         · SPONSORED_PAYER_SECRET_BS58
 *   2. JSON array of bytes (solana-keygen file contents)        · SPONSORED_PAYER_SECRET_JSON
 *
 * In Vercel: paste base58 export from Phantom, OR paste contents of ~/.config/solana/id.json
 * In tests: generate fresh keypair via Keypair.generate()
 *
 * Throws if no env var set OR malformed (fail-closed · we don't want a half-broken mint).
 */
export function loadSponsoredPayer(env: NodeJS.ProcessEnv = process.env): Keypair {
  const bs58Key = env.SPONSORED_PAYER_SECRET_BS58;
  if (bs58Key && bs58Key.length > 0) {
    const bytes = bs58.decode(bs58Key);
    if (bytes.length !== 64) {
      throw new Error(`SPONSORED_PAYER_SECRET_BS58 decoded to ${bytes.length} bytes · expected 64`);
    }
    return Keypair.fromSecretKey(bytes);
  }

  const jsonKey = env.SPONSORED_PAYER_SECRET_JSON;
  if (jsonKey && jsonKey.length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonKey);
    } catch (err) {
      throw new Error(`SPONSORED_PAYER_SECRET_JSON not valid JSON: ${(err as Error).message}`);
    }
    if (!Array.isArray(parsed) || parsed.length !== 64) {
      throw new Error("SPONSORED_PAYER_SECRET_JSON must be a 64-element byte array");
    }
    return Keypair.fromSecretKey(new Uint8Array(parsed as number[]));
  }

  throw new Error(
    "no sponsored-payer secret in env · set SPONSORED_PAYER_SECRET_BS58 or SPONSORED_PAYER_SECRET_JSON",
  );
}

/**
 * Build a partially-signed transaction · feePayer = sponsored-payer + arbitrary
 * instructions provided by caller. Returns base64-serialized tx ready for Blink response.
 *
 * The caller's wallet (passed as `userWallet`) is expected to sign as authority for
 * the included instructions · we DO NOT sign on its behalf.
 *
 * Returns:
 *   - base64Tx · for ActionPostResponse.transaction
 *   - signatureFromPayer · the partial sig we added (debug · log if needed)
 */
export async function buildPartialSignedTx(args: {
  connection: Connection;
  sponsoredPayer: Keypair;
  userWallet: PublicKey;
  instructions: TransactionInstruction[];
}): Promise<{ base64Tx: string; payerSignature: string }> {
  const { connection, sponsoredPayer, userWallet, instructions } = args;

  // Pre-flight · sanity check sponsored-payer != userWallet (would be a bug · payer can't be authority).
  if (sponsoredPayer.publicKey.equals(userWallet)) {
    throw new Error("sponsored-payer pubkey == user wallet · misconfiguration");
  }

  // Build tx with sponsored-payer as feePayer
  const tx = new Transaction();
  tx.feePayer = sponsoredPayer.publicKey;
  tx.add(...instructions);

  // Need fresh blockhash · cluster-validated freshness window ~150 slots / ~60s
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  // Partial-sign as feePayer · this attaches our sig to the appropriate slot
  // but leaves userWallet's slot empty for the wallet to fill in.
  tx.partialSign(sponsoredPayer);

  // Serialize · `requireAllSignatures: false` because user wallet hasn't signed yet
  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  const base64Tx = serialized.toString("base64");

  // Extract our partial sig for debugging (find the slot matching our pubkey)
  const ourSig = tx.signatures.find((s) => s.publicKey.equals(sponsoredPayer.publicKey))?.signature;
  const payerSignature = ourSig ? bs58.encode(ourSig) : "unsigned";

  return { base64Tx, payerSignature };
}

/**
 * Health check · returns sponsored-payer balance + canSponsor predicate.
 *
 * Use to gate `/api/actions/mint/genesis-stone` · refuse mint if payer balance
 * is below threshold (else first user to mint fails AND blames us).
 */
export async function checkPayerBalance(
  connection: Connection,
  sponsoredPayer: PublicKey,
): Promise<{ lamports: number; sol: number; canSponsor: boolean }> {
  const lamports = await connection.getBalance(sponsoredPayer, "confirmed");
  const sol = lamports / 1_000_000_000;
  // Each mint costs ~0.012 SOL (rent + fees) · keep 0.05 SOL buffer · refuse below
  const canSponsor = sol >= 0.05;
  return { lamports, sol, canSponsor };
}
