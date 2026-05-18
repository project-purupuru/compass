// Solana Actions CORS headers · per spec
// https://solana.com/docs/advanced/actions
//
// Required headers for Action endpoints to be unfurled by dialect/X/Phantom etc.
//
// X-Blockchain-Ids must use CAIP-2 canonical form (namespace:reference where
// reference is the first 32 chars of the cluster genesis hash) · NOT the
// shorthand "solana:devnet" · Dialect's adapter recognizes only the canonical
// IDs from @dialectlabs/blinks-core/BlockchainIds:
//   SOLANA_MAINNET = solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
//   SOLANA_DEVNET  = solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1
//   SOLANA_TESTNET = solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3

export const SOLANA_DEVNET_CAIP2 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;
export const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;

export const ACTION_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Action-Version, X-Blockchain-Ids",
  "Access-Control-Expose-Headers": "X-Action-Version, X-Blockchain-Ids",
  "X-Action-Version": "2.4",
  "X-Blockchain-Ids": SOLANA_DEVNET_CAIP2, // sprint-3 swaps to mainnet at deploy
  "Content-Type": "application/json",
} as const;

// Resolve the deployment base URL · prefer canonical env · fall back to localhost.
// Used to construct absolute href paths in ActionGetResponse buttons.
export const getBaseUrl = (request?: Request): string => {
  // Prefer explicit env var (set in vercel · sprint-3 production deploy).
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Derive from request origin if present.
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:3000";
};
