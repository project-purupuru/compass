"use client";

// Client-side Blink preview using @dialectlabs/blinks · the official
// Dialect React renderer. This is what users actually see in Phantom mobile,
// dial.to, or Twitter feeds (with the renderer's own card frame, typography,
// and button styling — NOT our app's design tokens).
//
// Why client-only: `useBlink` from @dialectlabs/blinks-core uses React hooks
// to fetch + watch the action JSON; the WalletProvider context the adapter
// hook depends on is also browser-only.
//
// Consumers:
//   /preview  → dev/ops surface · style preset tabs · raw JSON disclosure
//   /demo     → recording surface · no dev chrome · honest feed framing

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Blink, useAction } from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import "@dialectlabs/blinks/index.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const DEVNET_RPC = "https://api.devnet.solana.com";

interface BlinkPreviewProps {
  url: string;
  stylePreset?: "default" | "x-dark" | "x-light";
}

// Inner renderer · runs inside all the providers · grabs adapter + blink.
function BlinkInner({ url, stylePreset = "default" }: BlinkPreviewProps) {
  const { adapter } = useActionSolanaWalletAdapter(DEVNET_RPC);
  const { blink, isLoading } = useAction({ url });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-puru-cloud-shadow bg-puru-cloud-base p-8 text-center text-puru-ink-soft text-sm font-puru-mono">
        loading action…
      </div>
    );
  }
  if (!blink) {
    return (
      <div className="rounded-2xl border border-puru-fire-vivid bg-puru-fire-pastel p-6 text-puru-ink-rich text-sm">
        <p className="font-puru-display text-base mb-1">action did not load</p>
        <p className="text-xs font-puru-mono break-all opacity-70">target: {url}</p>
      </div>
    );
  }
  // securityLevel="all" allows unregistered actions to execute · default
  // "only-trusted" gates everything behind Dialect's BlinksRegistry which is
  // for verified production providers only · we trust our own /api/actions/*
  // URLs · the warning banner ("This Action has not yet been registered") is
  // about RUNTIME EXECUTION blocking, not display. Without "all" the buttons
  // appear but click does nothing because executeFn refuses to run.
  return <Blink blink={blink} adapter={adapter} stylePreset={stylePreset} securityLevel="all" />;
}

// Outer · provides wallet/connection context.
//
// Why we register Phantom even for read-only-feeling preview:
// Dialect's BlinkComponent disables ALL buttons (including type:"post" chain
// links that don't actually need a signature) when the wallet provider has
// no registered wallets · because there's nothing for the connect-flow to
// open. Registering Phantom (the most common Solana wallet) gives the connect
// flow a target · buttons enable · users click "claim your stone" → Phantom
// modal → connect → tx flow proceeds (sprint-3 wires real claim_genesis_stone).
export function BlinkPreview(props: BlinkPreviewProps) {
  // useMemo keeps the adapter instance stable across re-renders · otherwise
  // every render would construct a new PhantomWalletAdapter and the WalletProvider
  // would re-initialize, breaking the connect flow mid-session.
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={DEVNET_RPC}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <BlinkInner {...props} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
