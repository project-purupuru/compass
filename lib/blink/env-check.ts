// Env preflight · surfaces all missing mint-flow config in one error rather
// than failing on the first runtime path. Call at the top of API routes that
// need real Solana + KV + HMAC config.

interface EnvSpec {
  name: string;
  required: boolean;
  validate?: (value: string) => string | null; // returns error message or null
  hint: string;
}

// Validate hex-encoded secret length.
const expectHex = (lengthBytes: number) => (value: string) => {
  if (value.length !== lengthBytes * 2) {
    return `expected ${lengthBytes * 2} hex chars (${lengthBytes} bytes), got ${value.length}`;
  }
  if (!/^[0-9a-fA-F]+$/.test(value)) {
    return "value contains non-hex characters";
  }
  return null;
};

// Mint-flow required env · checked at top of /api/actions/mint/genesis-stone.
const MINT_ENV_SPEC: EnvSpec[] = [
  {
    name: "CLAIM_SIGNER_SECRET_BS58",
    required: true,
    hint: "ed25519 keypair · base58-encoded 64-byte secret · must derive CLAIM_SIGNER_PUBKEY hardcoded in lib.rs",
  },
  {
    name: "SPONSORED_PAYER_SECRET_BS58",
    required: true,
    hint: "Solana keypair (base58) that pays tx fees · ≥0.05 SOL devnet balance · separate from claim-signer",
  },
  {
    name: "QUIZ_HMAC_KEY",
    required: true,
    validate: expectHex(32),
    hint: "32-byte hex key for quiz state HMAC · generate with: openssl rand -hex 32",
  },
  {
    name: "KV_REST_API_URL",
    required: true,
    hint: "Vercel KV REST endpoint · auto-set by Vercel KV provisioning",
  },
  {
    name: "KV_REST_API_TOKEN",
    required: true,
    hint: "Vercel KV REST auth token · auto-set by Vercel KV provisioning",
  },
  {
    name: "SOLANA_RPC_URL",
    required: false,
    hint: "Solana RPC endpoint · defaults to https://api.devnet.solana.com",
  },
];

export interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  invalid: Array<{ name: string; reason: string }>;
  formatted: string;
}

// Check all mint-flow env vars · returns a structured result for the route to
// shape into a 500 response. `formatted` is a human-readable multi-line string
// safe for server logs (does NOT echo any actual env values).
export function checkMintEnv(env: NodeJS.ProcessEnv = process.env): EnvCheckResult {
  const missing: string[] = [];
  const invalid: Array<{ name: string; reason: string }> = [];

  for (const spec of MINT_ENV_SPEC) {
    const value = env[spec.name];
    if (!value || value.length === 0) {
      if (spec.required) missing.push(spec.name);
      continue;
    }
    if (spec.validate) {
      const err = spec.validate(value);
      if (err) invalid.push({ name: spec.name, reason: err });
    }
  }

  const ok = missing.length === 0 && invalid.length === 0;

  const lines: string[] = [];
  if (!ok) {
    lines.push("Mint-flow env config not ready:");
    if (missing.length > 0) {
      lines.push("  Missing required vars:");
      for (const name of missing) {
        const spec = MINT_ENV_SPEC.find((s) => s.name === name);
        lines.push(`    - ${name} · ${spec?.hint ?? ""}`);
      }
    }
    if (invalid.length > 0) {
      lines.push("  Invalid vars:");
      for (const { name, reason } of invalid) {
        lines.push(`    - ${name} · ${reason}`);
      }
    }
  }

  return {
    ok,
    missing,
    invalid,
    formatted: lines.join("\n"),
  };
}
