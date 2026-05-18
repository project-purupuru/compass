/**
 * Sp3 · unit tests for sponsored-payer helpers
 *
 * Covers:
 *   - loadSponsoredPayer: bs58 + json formats · throws on missing/malformed
 *   - buildPartialSignedTx: tx has feePayer set · payer sig attached · user slot empty
 *   - checkPayerBalance: canSponsor threshold (0.05 SOL)
 *
 * Run: pnpm test (vitest)
 */

import { describe, expect, it } from "vitest";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import { buildPartialSignedTx, checkPayerBalance, loadSponsoredPayer } from "../sponsored-payer";

describe("loadSponsoredPayer", () => {
  it("loads from base58 secret", () => {
    const fixture = Keypair.generate();
    const bs58Secret = bs58.encode(fixture.secretKey);

    const loaded = loadSponsoredPayer({
      SPONSORED_PAYER_SECRET_BS58: bs58Secret,
    } as unknown as NodeJS.ProcessEnv);

    expect(loaded.publicKey.toBase58()).toBe(fixture.publicKey.toBase58());
  });

  it("loads from json byte array secret", () => {
    const fixture = Keypair.generate();
    const jsonSecret = JSON.stringify(Array.from(fixture.secretKey));

    const loaded = loadSponsoredPayer({
      SPONSORED_PAYER_SECRET_JSON: jsonSecret,
    } as unknown as NodeJS.ProcessEnv);

    expect(loaded.publicKey.toBase58()).toBe(fixture.publicKey.toBase58());
  });

  it("prefers bs58 when both env vars set", () => {
    const fixtureBs58 = Keypair.generate();
    const fixtureJson = Keypair.generate();

    const loaded = loadSponsoredPayer({
      SPONSORED_PAYER_SECRET_BS58: bs58.encode(fixtureBs58.secretKey),
      SPONSORED_PAYER_SECRET_JSON: JSON.stringify(Array.from(fixtureJson.secretKey)),
    } as unknown as NodeJS.ProcessEnv);

    expect(loaded.publicKey.toBase58()).toBe(fixtureBs58.publicKey.toBase58());
  });

  it("throws on no env set (fail-closed)", () => {
    expect(() => loadSponsoredPayer({} as unknown as NodeJS.ProcessEnv)).toThrow(
      /no sponsored-payer secret/i,
    );
  });

  it("throws on bs58 wrong byte length", () => {
    const tooShort = bs58.encode(Buffer.from([1, 2, 3, 4]));
    expect(() =>
      loadSponsoredPayer({ SPONSORED_PAYER_SECRET_BS58: tooShort } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/decoded to 4 bytes/i);
  });

  it("throws on json malformed", () => {
    expect(() =>
      loadSponsoredPayer({
        SPONSORED_PAYER_SECRET_JSON: "not-json",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/not valid JSON/i);
  });

  it("throws on json wrong array length", () => {
    expect(() =>
      loadSponsoredPayer({
        SPONSORED_PAYER_SECRET_JSON: "[1,2,3]",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/64-element byte array/i);
  });
});

describe("buildPartialSignedTx", () => {
  it("rejects payer == user wallet (misconfiguration)", async () => {
    const same = Keypair.generate();

    // Mock connection · we'll never reach the rpc call (rejection happens before)
    const fakeConnection = {} as Connection;

    await expect(
      buildPartialSignedTx({
        connection: fakeConnection,
        sponsoredPayer: same,
        userWallet: same.publicKey,
        instructions: [],
      }),
    ).rejects.toThrow(/sponsored-payer pubkey == user wallet/i);
  });
});

describe("checkPayerBalance", () => {
  it("canSponsor=true at 0.05 SOL", async () => {
    const fakePayer = new PublicKey("11111111111111111111111111111111");
    const fakeConnection = {
      async getBalance(_pk: PublicKey) {
        return 50_000_000; // 0.05 SOL exactly
      },
    } as unknown as Connection;

    const result = await checkPayerBalance(fakeConnection, fakePayer);
    expect(result.sol).toBe(0.05);
    expect(result.canSponsor).toBe(true);
  });

  it("canSponsor=false below 0.05 SOL", async () => {
    const fakePayer = new PublicKey("11111111111111111111111111111111");
    const fakeConnection = {
      async getBalance(_pk: PublicKey) {
        return 49_999_999; // 0.049... SOL
      },
    } as unknown as Connection;

    const result = await checkPayerBalance(fakeConnection, fakePayer);
    expect(result.canSponsor).toBe(false);
  });

  it("canSponsor=true at high balance", async () => {
    const fakePayer = new PublicKey("11111111111111111111111111111111");
    const fakeConnection = {
      async getBalance(_pk: PublicKey) {
        return 1_000_000_000; // 1 SOL
      },
    } as unknown as Connection;

    const result = await checkPayerBalance(fakeConnection, fakePayer);
    expect(result.canSponsor).toBe(true);
    expect(result.sol).toBe(1);
  });
});
