// Minimal Solana Actions types · per Solana Actions specification
// SDD r2 §4.1+§4.2 · we only need the response shapes · not full client SDK.
//
// Reference: https://docs.solana.com/actions
// v0 keeps this minimal · upgrade to @solana/actions package when ergonomics demand.

// LinkedActionType · per Solana Actions spec (matches @dialectlabs/blinks-core).
// Drives client-side handling of button click:
//   "transaction"   → POST returns base64 tx → wallet signs (default · requires wallet)
//   "post"          → POST returns next action inline → no wallet needed (chain nav)
//   "external-link" → button is a plain hyperlink (degraded · navigates away)
//   "message"       → POST returns text-to-sign (sign-message flow)
//   "inline-link"   → href fetched as GET · returns next action inline (rare)
export type LinkedActionType = "transaction" | "post" | "external-link" | "message" | "inline-link";

// Action chained linked button.
export interface LinkedAction {
  /** Type of action · REQUIRED in Solana Actions spec v2.4+ · defaults to "transaction" if omitted */
  type: LinkedActionType;
  label: string;
  href: string;
  // input fields disallowed v0 per BLINK_DESCRIPTOR · button-multichoice only
}

// Standard ActionGetResponse · what GET endpoints return.
export interface ActionGetResponse {
  icon: string; // URL to image (≤ 128 KiB · per BLINK_DESCRIPTOR)
  title: string; // ≤ 80 chars
  description: string; // ≤ 280 chars
  label: string;
  links?: {
    actions: LinkedAction[];
  };
  disabled?: boolean;
  error?: { message: string };
}

// NextAction chain link · used in POST response `links.next` to drive the chain.
//   type "post":   client POSTs to href to fetch the next action
//   type "inline": next action is embedded directly · client renders without extra fetch
export type NextActionLink =
  | { type: "post"; href: string }
  | { type: "inline"; action: ActionGetResponse };

// ActionPostResponse · response from POST when button.type === "transaction".
// Contains a base64-encoded tx the wallet signs + submits.
export interface ActionPostResponse {
  type?: "transaction";
  transaction: string;
  message?: string;
  links?: {
    next?: NextActionLink;
  };
}

// PostResponse · response from POST when button.type === "post".
// NO transaction · just chains to the next action (or terminates with a message).
// This is what our quiz-step + quiz-result POST handlers return.
export interface PostResponse {
  type: "post";
  message?: string;
  links?: {
    next: NextActionLink;
  };
}

// BLINK_DESCRIPTOR constraints (cycle-X upstream PR target · per FR-2).
// Mirrors freeside-mediums sealed-schema discriminated-union pattern.
export const BLINK_DESCRIPTOR = {
  _tag: "blink" as const,
  iconMaxBytes: 128 * 1024,
  titleMaxChars: 80,
  descriptionMaxChars: 280,
  buttonsMax: 5,
  inputFieldsAllowed: [] as const, // v0 disallows · button-multichoice only
  txShape: "anchor-witness | anchor-genesis-stone-claim",
  actionChaining: true,
  walletAwareGet: false, // GET is anonymous per Actions spec
  presentationBoundary: "cmp-boundary-presentation",
  nftStandard: "metaplex-token-metadata",
} as const;

export type BlinkDescriptor = typeof BLINK_DESCRIPTOR;
