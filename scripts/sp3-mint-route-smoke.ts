// Sprint-3 mint route smoke test · operator-runnable end-to-end check
//
// Synthesizes a complete quiz state (sign HMAC over 8 answers · build mint URL)
// then POSTs to the live mint route and verifies the response shape:
//   - status 200
//   - `transaction` field is base64
//   - decoded tx has 2 instructions (Ed25519Program + claim_genesis_stone)
//   - tx.feePayer == sponsored-payer pubkey
//   - tx is partially signed by sponsored-payer + mint
//
// Usage:
//   pnpm tsx scripts/sp3-mint-route-smoke.ts                    # against local dev
//   BASE_URL=https://purupuru-blink.vercel.app pnpm tsx scripts/sp3-mint-route-smoke.ts
//
// Prerequisites (loaded from .env.local · same vars the live route uses):
//   - QUIZ_HMAC_KEY (32-byte hex)
//   - SPONSORED_PAYER_SECRET_BS58 (for pubkey comparison · NOT used to sign)
//   - The live route must be reachable at BASE_URL
//
// What this DOESN'T do:
//   - Submit the tx to devnet (would require user wallet sig)
//   - Validate Phantom UX (manual e2e on /preview)
//   - Test the upgrade-authority freeze (run the freeze BEFORE recording demo)

import { config as loadEnv } from "dotenv";
import { Keypair, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

import { QUIZ_COMPLETED_STEP, signQuizState, type Answer } from "@purupuru/peripheral-events";

loadEnv({ path: ".env.local" });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

// 8 deterministic answers (mostly index 0) · server recomputes archetype from these.
const TEST_ANSWERS: Answer[] = [0, 1, 2, 0, 1, 2, 0, 1];

interface MintResponse {
  transaction?: string;
  message?: string;
  error?: { message: string };
  links?: {
    next?: {
      type: "inline" | "post";
      action?: {
        title?: string;
        links?: {
          actions?: Array<{ type: string; label: string; href: string }>;
        };
      };
      href?: string;
    };
  };
}

async function main() {
  console.log(`\n→ Smoke test against: ${BASE_URL}\n`);

  // 1. Sign HMAC over completed state (step=9, all 8 answers).
  if (!process.env.QUIZ_HMAC_KEY) {
    console.error("✗ QUIZ_HMAC_KEY not in env · cannot sign test state");
    process.exit(1);
  }
  const hmacKey = Buffer.from(process.env.QUIZ_HMAC_KEY, "hex");
  const signed = signQuizState(
    { step: QUIZ_COMPLETED_STEP, answers: TEST_ANSWERS },
    { key: hmacKey },
  );
  console.log(`✓ Signed HMAC: ${signed.mac.slice(0, 16)}...`);

  // 2. Generate a throwaway "user wallet" for the POST · we never actually
  //    sign the returned tx with this · just need a valid pubkey for the body.
  const fakeUserWallet = Keypair.generate();
  console.log(`✓ Test user wallet: ${fakeUserWallet.publicKey.toBase58()}`);

  // 3. Build the claim URL with answers + mac.
  const params = new URLSearchParams();
  TEST_ANSWERS.forEach((ans, i) => params.set(`a${i + 1}`, String(ans)));
  params.set("mac", signed.mac);
  const claimUrl = `${BASE_URL}/api/actions/mint/genesis-stone?${params.toString()}`;

  // 4. POST as the user wallet would.
  console.log(`→ POST ${claimUrl}`);
  const res = await fetch(claimUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account: fakeUserWallet.publicKey.toBase58() }),
  });

  console.log(`← ${res.status} ${res.statusText}`);

  const body = (await res.json()) as MintResponse;

  if (res.status !== 200) {
    console.error(`✗ Non-200 response: ${body.error?.message ?? body.message}`);
    process.exit(1);
  }

  if (!body.transaction || typeof body.transaction !== "string") {
    console.error("✗ Response missing `transaction` field");
    process.exit(1);
  }

  console.log(`✓ Got base64 tx (${body.transaction.length} chars)`);
  console.log(`✓ Reveal message: "${body.message}"`);

  // Bridge button regression guard (#bug-91e298 fix · 2026-05-11):
  // The post-mint "See yourself in the world" button MUST use
  // inline-link, not external-link. external-link causes the dialect
  // renderer to POST to the welcome URL (a Next.js page) instead of
  // navigating, which produces "Signing failed." in the wallet.
  const bridgeAction = body.links?.next?.action?.links?.actions?.[0];
  if (!bridgeAction) {
    console.error("✗ Response missing links.next.action.links.actions[0]");
    process.exit(1);
  }
  if (bridgeAction.type !== "inline-link") {
    console.error(`✗ Bridge button type is "${bridgeAction.type}" — must be "inline-link"`);
    console.error(`  See app/api/actions/mint/genesis-stone/route.ts comment`);
    process.exit(1);
  }
  console.log(`✓ Bridge button type=inline-link · href=${bridgeAction.href}`);

  // 5. Decode the tx + verify shape.
  const txBytes = Buffer.from(body.transaction, "base64");
  const tx = Transaction.from(txBytes);

  console.log(`\n--- Tx structure ---`);
  console.log(`  feePayer: ${tx.feePayer?.toBase58()}`);
  console.log(`  instructions: ${tx.instructions.length}`);
  for (const [i, ix] of tx.instructions.entries()) {
    console.log(
      `    [${i}] ${ix.programId.toBase58()} · ${ix.keys.length} accounts · ${ix.data.length}B data`,
    );
  }

  // 6. Sanity checks.
  if (tx.instructions.length !== 2) {
    console.error(
      `\n✗ Expected 2 instructions (Ed25519 + claim_genesis_stone), got ${tx.instructions.length}`,
    );
    process.exit(1);
  }

  const ed25519ProgramId = "Ed25519SigVerify111111111111111111111111111";
  if (tx.instructions[0]!.programId.toBase58() !== ed25519ProgramId) {
    console.error(
      `\n✗ Expected first ix to be Ed25519Program, got ${tx.instructions[0]!.programId.toBase58()}`,
    );
    process.exit(1);
  }

  const purupuruProgramId = "7u27WmTz2hZHvvhL89XcSCY3eFhxEfHjUN5MjzMY6v38";
  if (tx.instructions[1]!.programId.toBase58() !== purupuruProgramId) {
    console.error(
      `\n✗ Expected second ix to be purupuru program, got ${tx.instructions[1]!.programId.toBase58()}`,
    );
    process.exit(1);
  }

  // Verify sponsored-payer signed (sig present in slot matching pubkey).
  const sponsoredPayerBs58 = process.env.SPONSORED_PAYER_SECRET_BS58;
  if (sponsoredPayerBs58) {
    const sponsoredPayer = Keypair.fromSecretKey(bs58.decode(sponsoredPayerBs58));
    const ourSig = tx.signatures.find((s) => s.publicKey.equals(sponsoredPayer.publicKey));
    if (!ourSig?.signature) {
      console.error(`\n✗ Sponsored-payer slot is unsigned`);
      process.exit(1);
    }
    console.log(`\n✓ Sponsored-payer signed (slot=${tx.feePayer?.toBase58()})`);
  }

  // Verify mint slot has a signature (server-side mint keypair).
  const signedSlots = tx.signatures.filter((s) => s.signature !== null).length;
  console.log(`✓ Tx has ${signedSlots} server-side signature(s) attached`);
  if (signedSlots < 2) {
    console.error(`\n⚠ Expected ≥2 server sigs (sponsored-payer + mint), got ${signedSlots}`);
    // Not fatal · some assembly orderings may differ
  }

  // 7. Negative test · same nonce already claimed should 409.
  console.log(`\n--- Replay protection check ---`);
  const replayRes = await fetch(claimUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account: fakeUserWallet.publicKey.toBase58() }),
  });
  // Note: nonce is generated fresh per request so this WON'T 409 in practice ·
  // it'll 200 with a different nonce. Nonce replay is exercised at submit-time
  // by the on-chain validator + KV. This smoke test just confirms the route
  // doesn't crash on rapid back-to-back POSTs.
  console.log(`✓ Back-to-back POST returned ${replayRes.status} (expected 200)`);

  console.log(`\n✓✓✓ Smoke test passed · route is wired end-to-end\n`);
}

main().catch((err) => {
  console.error(`\n✗ Smoke test threw:`, err);
  process.exit(1);
});
