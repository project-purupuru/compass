/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/purupuru_anchor.json`.
 */
export type PurupuruAnchor = {
  address: "7u27WmTz2hZHvvhL89XcSCY3eFhxEfHjUN5MjzMY6v38";
  metadata: {
    name: "purupuruAnchor";
    version: "0.1.0";
    spec: "0.1.0";
    description: "purupuru awareness layer · claim_genesis_stone with Metaplex CPI mint";
  };
  instructions: [
    {
      name: "claimGenesisStone";
      docs: [
        "Server-signed mint of a Genesis Stone · the awareness-layer demo's",
        "only mutating instruction.",
        "",
        "The 7 args projected from off-chain `ClaimMessage`:",
        "- `wallet`: the user's pubkey · also the mint recipient",
        "- `element`: bazi-derived element byte (1=Wood..5=Water · per byteOf rules)",
        "- `weather`: cosmic weather byte at mint time",
        "- `quiz_state_hash`: sha256 of the validated 5-answer quiz state",
        "- `issued_at`: unix seconds · when claim-signer signed",
        "- `expires_at`: unix seconds · 5min after issued (server-side TTL)",
        "- `nonce`: 16-byte nonce · server-side replay protection (Vercel KV)",
        "",
        "The full 11-field off-chain ClaimMessage struct also contains",
        "{domain, version, cluster, programId} · those are NOT in the signed",
        "bytes. Domain separation is enforced via:",
        "- `declare_id!()` pins the program (cluster + programId implicit)",
        "- hardcoded `CLAIM_SIGNER_PUBKEY` pins the signer",
        "- dedicated single-purpose claim-signer key (domain implicit)",
        "",
        "If the claim-signer key is ever shared across programs/clusters,",
        "upgrade the canonical bytes to include those fields BEFORE doing so.",
      ];
      discriminator: [29, 163, 209, 27, 78, 111, 44, 147];
      accounts: [
        {
          name: "authority";
          docs: [
            "User wallet · mint authority + update authority + NFT recipient.",
            "MUTABLE because the CreateV1 CPI will assign metadata authority to it.",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "sponsoredPayer";
          docs: [
            "Sponsored-payer · pays rent for new mint + metadata + master_edition",
            "accounts (~0.012 SOL total). Separate keypair from claim-signer per",
            "SDD §6.1 three-keypair model · drained sponsored-payer = mint goes",
            "down for refill, but user funds + claim authority unaffected.",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "mint";
          docs: [
            "Fresh mint keypair generated server-side per claim · signs the tx so",
            "SPL Mint init can finalize the supply-1 invariant. Becomes the NFT's",
            "permanent on-chain identity.",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "metadata";
          docs: [
            "Metaplex Metadata PDA at seeds:",
            '[b"metadata", token_metadata_program_id, mint_pubkey]',
            "Created + populated by CreateV1 CPI.",
          ];
          writable: true;
        },
        {
          name: "masterEdition";
          docs: [
            "Metaplex Master Edition PDA at seeds:",
            '[b"metadata", token_metadata_program_id, mint_pubkey, b"edition"]',
            "Enforces NonFungible supply=1 invariant.",
          ];
          writable: true;
        },
        {
          name: "instructionsSysvar";
          docs: [
            "Solana instructions sysvar · used twice in this ix:",
            "1. Sp2 ed25519 verification (parse prior Ed25519Program ix)",
            "2. Passed to Metaplex CreateV1 (it reads sysvar for some checks)",
          ];
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "systemProgram";
          docs: ["Solana System Program · for new account allocation rent."];
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          docs: ["SPL Token program · for SPL Mint initialization."];
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "tokenMetadataProgram";
          docs: ["Metaplex Token Metadata program · target of the CreateV1 CPI."];
          address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
        },
      ];
      args: [
        {
          name: "wallet";
          type: "pubkey";
        },
        {
          name: "element";
          type: "u8";
        },
        {
          name: "weather";
          type: "u8";
        },
        {
          name: "quizStateHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "issuedAt";
          type: "i64";
        },
        {
          name: "expiresAt";
          type: "i64";
        },
        {
          name: "nonce";
          type: {
            array: ["u8", 16];
          };
        },
      ];
    },
  ];
  events: [
    {
      name: "stoneClaimed";
      discriminator: [138, 131, 241, 101, 8, 187, 119, 216];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "noPriorInstruction";
      msg: "No prior instruction in transaction (this must run AFTER an Ed25519Program ix)";
    },
    {
      code: 6001;
      name: "priorIxNotEd25519";
      msg: "Prior instruction is not the Ed25519Program";
    },
    {
      code: 6002;
      name: "invalidEd25519Data";
      msg: "Ed25519 instruction data is malformed";
    },
    {
      code: 6003;
      name: "signerMismatch";
      msg: "Signer pubkey does not match the hardcoded claim-signer";
    },
    {
      code: 6004;
      name: "messageMismatch";
      msg: "Message bytes do not match the reconstituted canonical layout";
    },
    {
      code: 6005;
      name: "elementOutOfRange";
      msg: "Element byte must be in 1..5 (1=Wood, 2=Fire, 3=Earth, 4=Metal, 5=Water)";
    },
    {
      code: 6006;
      name: "weatherOutOfRange";
      msg: "Weather byte must be in 1..5 (same element scale)";
    },
    {
      code: 6007;
      name: "issuedAfterExpiry";
      msg: "issued_at is after expires_at (clock or producer bug)";
    },
    {
      code: 6008;
      name: "expired";
      msg: "Claim has expired (now > expires_at · 5min server-side TTL window)";
    },
  ];
  types: [
    {
      name: "stoneClaimed";
      docs: [
        "Emitted on successful Genesis Stone claim · indexer subscribes via",
        "program logs to update the awareness-layer feed.",
        "",
        "NOT emitted in Phase A (no mint yet · `mint` field not available).",
        "Phase B + C add the emit! call.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "wallet";
            type: "pubkey";
          },
          {
            name: "element";
            type: "u8";
          },
          {
            name: "weather";
            type: "u8";
          },
          {
            name: "mint";
            type: "pubkey";
          },
        ];
      };
    },
  ];
};
