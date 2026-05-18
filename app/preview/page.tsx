// Local Blink preview page · renders Solana Action JSON via the OFFICIAL
// @dialectlabs/blinks React component (BlinkPreview wrapper).
// What you see here is what users see in Phantom mobile + dial.to + Twitter.
//
// Usage:
//   /preview                       → defaults to /api/actions/quiz/start
//   /preview?url=<absolute-or-rel> → renders any action URL
//   /preview?url=...&style=x-dark  → switch dialect style preset

import Link from "next/link";

import { BlinkPreview } from "@/components/blink/blink-preview";
import { pageMetadata } from "@/lib/seo/metadata";
import "@/components/blink/blink-styles.css";

export const metadata = pageMetadata("preview");

interface ActionResponse {
  icon: string;
  title: string;
  description: string;
  label: string;
  links?: {
    actions: Array<{ label: string; href: string }>;
  };
  error?: { message?: string };
}

interface PageProps {
  searchParams: Promise<{ url?: string; style?: string }>;
}

async function fetchAction(targetUrl: string): Promise<{
  data: ActionResponse | null;
  status: number;
  raw: string;
}> {
  try {
    const res = await fetch(targetUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const raw = await res.text();
    let data: ActionResponse | null = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // raw stays · we'll show it
    }
    return { data, status: res.status, raw };
  } catch (err) {
    return { data: null, status: 0, raw: String(err) };
  }
}

const STYLE_PRESETS = ["default", "x-dark", "x-light"] as const;
type StylePreset = (typeof STYLE_PRESETS)[number];

export default async function PreviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const targetUrl = params.url ?? `${baseUrl}/api/actions/quiz/start`;
  // Default x-light · matches the world repo's cream-surface landing.
  // x-dark + default still selectable via the header tabs for comparison.
  const stylePreset: StylePreset = STYLE_PRESETS.find((p) => p === params.style) ?? "x-light";

  const { data, status, raw } = await fetchAction(targetUrl);

  return (
    // h-dvh + overflow-y-auto override the globals.css `overflow: hidden` on
    // html/body (set there for the Pixi canvas main app · doesn't suit a
    // scrolling preview page).
    <main className="h-dvh overflow-y-auto bg-puru-cloud-deep p-6 md:p-12 font-puru-body">
      {/* max-w-md (448px) ≈ mobile-card width · forces buttons to stack
          vertically per Dialect's responsive layout · matches what users
          actually see in Phantom mobile + Twitter feed.
          .preview-blink-scope activates ./preview-overrides.css that
          forces equal-width buttons + label wrap (vs Dialect's content-sized
          default which produces overflow on long labels). */}
      {/* data-theme bound to stylePreset · x-dark triggers our old-horai
          dark caliber (same tokens, dark values cascade automatically) ·
          x-light/default stays in default light caliber (cream + honey).
          ONE source of truth for theme · driven from one query param. */}
      <div
        data-theme={stylePreset === "x-dark" ? "old-horai" : undefined}
        className="purupuru-blink-scope mx-auto max-w-md space-y-6 pb-24"
      >
        {/* Header · which endpoint we're previewing */}
        <header className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-puru-ink-base text-2xl font-puru-display">Blink Preview</h1>
            <span className="text-puru-ink-dim text-xs font-puru-mono">
              @dialectlabs/blinks · {stylePreset}
            </span>
          </div>
          <div className="text-puru-ink-soft text-xs font-puru-mono break-all">
            <span className="text-puru-ink-dim">target → </span>
            <span>{targetUrl}</span>
            <span className="text-puru-ink-dim ml-2">[HTTP {status || "fail"}]</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-puru-ink-dim font-puru-mono">
            <Link
              href={`/preview?style=${stylePreset}`}
              className="underline hover:text-puru-ink-base"
            >
              ↻ start over (Q1)
            </Link>
            <Link
              href={`/preview?url=${encodeURIComponent(`${baseUrl}/api/actions/today`)}&style=${stylePreset}`}
              className="underline hover:text-puru-ink-base"
            >
              ☼ ambient
            </Link>
            <span className="text-puru-ink-dim">|</span>
            {STYLE_PRESETS.map((p) => (
              <Link
                key={p}
                href={`/preview?url=${encodeURIComponent(targetUrl)}&style=${p}`}
                className={`underline ${
                  p === stylePreset ? "text-puru-ink-base font-bold" : "hover:text-puru-ink-base"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </header>

        {/* The card · rendered by the OFFICIAL Dialect Blink component.
           This is the production rendering · what users actually see. */}
        <BlinkPreview url={targetUrl} stylePreset={stylePreset} />

        {/* Raw JSON · always shown for debug */}
        {data && (
          <details className="text-xs">
            <summary className="cursor-pointer text-puru-ink-dim font-puru-mono hover:text-puru-ink-base">
              ▾ raw JSON returned by {targetUrl.split("/").slice(-3).join("/")}
            </summary>
            <pre className="mt-2 p-4 bg-puru-cloud-shadow rounded-lg text-puru-ink-soft overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
        {!data && raw && (
          <details className="text-xs" open>
            <summary className="cursor-pointer text-puru-fire-vivid font-puru-mono">
              ▾ raw response (parse failed)
            </summary>
            <pre className="mt-2 p-4 bg-puru-fire-pastel rounded-lg text-puru-ink-rich overflow-x-auto whitespace-pre-wrap break-all">
              {raw}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
