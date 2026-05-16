import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UI Explorer · Kit",
  description: "Tasting menu for game-UI mockups. Drop ChatGPT image returns, taste-test, hand to agent.",
};

/**
 * UI Explorer — operator's tasting menu.
 *
 * Drop returned ChatGPT image mockups into:
 *   public/art/mockups/<screen>/{a,b,c,d}.png  (sliced 2x2 tiles)
 *   public/art/mockups/<screen>/grid.png        (unsliced 2x2 grid)
 *   public/art/mockups/<screen>/notes.md        (operator's verdict)
 *
 * The page reads filesystem state at request time and renders what's present.
 * Source artifact: grimoires/loa/proposals/ui-mockup-prompts-2026-05-12.md
 */

const SCREENS: ReadonlyArray<{
  readonly slug: "lock" | "arrange" | "clash" | "result" | "card" | "status";
  readonly title: string;
  readonly intent: string;
  readonly liveRoute: string;
  readonly prompt: string;
}> = [
  {
    slug: "lock",
    title: "Lock Screen",
    intent:
      "Title / menu — 4 layout directions: Inscryption-diegetic, Spiritfarer-lyric, Slay-the-Spire-structured, Sable-minimalist.",
    liveRoute: "/battle",
    prompt: "§2.1 of ui-mockup-prompts-2026-05-12.md",
  },
  {
    slug: "arrange",
    title: "Arena · Arrange Phase",
    intent:
      "Pre-clash lineup — 4 directions: Slay-pragmatic, Inscryption-table, Monster-Train-lanes, Hades-cinematic.",
    liveRoute: "/battle",
    prompt: "§2.2 of ui-mockup-prompts-2026-05-12.md",
  },
  {
    slug: "clash",
    title: "Arena · Clash Moment",
    intent:
      "Card-vs-card collision — 4 directions: camera-push cinematic, top-down table, lane-stratified, painted cutscene.",
    liveRoute: "/battle",
    prompt: "§2.3 of ui-mockup-prompts-2026-05-12.md",
  },
  {
    slug: "result",
    title: "Result Screen",
    intent:
      "Post-match outcome — 4 directions: tidal-bloom, tea-house-quiet, sky-banner, Loop-Hero-stats. No victory/defeat language.",
    liveRoute: "/battle",
    prompt: "§2.4 of ui-mockup-prompts-2026-05-12.md",
  },
  {
    slug: "card",
    title: "Card-in-Hand",
    intent:
      "Frame / stack composition — 4 directions: painted frame, woodcut numerals, ribbon-flow, modern minimal tarot.",
    liveRoute: "/battle",
    prompt: "§2.5 of ui-mockup-prompts-2026-05-12.md",
  },
  {
    slug: "status",
    title: "Status Indicators",
    intent:
      "Weather / affinity / tide / resonance readouts — 4 directions: paper-amulets, ink-brush margin, stone-lanterns, hanko stamps.",
    liveRoute: "/battle",
    prompt: "§2.6 of ui-mockup-prompts-2026-05-12.md",
  },
];

const VARIANTS = ["a", "b", "c", "d"] as const;
type Variant = (typeof VARIANTS)[number];

const REPO_ROOT = process.cwd();
const MOCKUPS_DIR = path.join(REPO_ROOT, "public", "art", "mockups");

function hasFile(rel: string): boolean {
  try {
    fs.accessSync(path.join(REPO_ROOT, "public", rel), fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function readNotes(slug: string): string | null {
  const p = path.join(MOCKUPS_DIR, slug, "notes.md");
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}

function variantSrc(slug: string, v: Variant): string {
  return `/art/mockups/${slug}/${v}.png`;
}

function gridSrc(slug: string): string {
  return `/art/mockups/${slug}/grid.png`;
}

export default function UiExplorerPage() {
  return (
    <main className="min-h-dvh w-full bg-puru-cloud-base text-puru-ink-base">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-8 py-12">
        <header className="flex flex-col gap-4">
          <p className="font-puru-mono text-2xs uppercase tracking-[0.2em] text-puru-ink-soft">
            kit · ui-explorer
          </p>
          <h1 className="font-puru-display text-3xl font-semibold leading-puru-tight tracking-tight text-puru-ink-rich">
            Game-UI tasting menu
          </h1>
          <p className="max-w-2xl text-base leading-puru-normal text-puru-ink-soft">
            Default mockup format:{" "}
            <strong className="font-puru-display text-puru-ink-rich">
              16:9 horizontal / desktop
            </strong>{" "}
            (Purupuru is a horizontal app). Drop ChatGPT image returns into{" "}
            <code className="rounded bg-puru-cloud-bright px-1.5 py-0.5 font-puru-mono text-xs">
              public/art/mockups/&lt;screen&gt;/{"{a,b,c,d}"}.png
            </code>
            . One landscape image per variant — no slicing needed. Refresh. Mark favorites in{" "}
            <code className="rounded bg-puru-cloud-bright px-1.5 py-0.5 font-puru-mono text-xs">
              notes.md
            </code>{" "}
            or just tell the agent.
          </p>
          <p className="max-w-2xl text-sm leading-puru-normal text-puru-ink-soft">
            Prompts live at{" "}
            <code className="rounded bg-puru-cloud-bright px-1.5 py-0.5 font-puru-mono text-xs">
              grimoires/loa/proposals/ui-mockup-prompts-2026-05-12.md
            </code>
          </p>
        </header>

        {SCREENS.map((screen) => {
          const notes = readNotes(screen.slug);
          const hasGrid = hasFile(`art/mockups/${screen.slug}/grid.png`);
          const tileFlags = VARIANTS.map((v) => hasFile(`art/mockups/${screen.slug}/${v}.png`));
          const droppedCount =
            tileFlags.filter(Boolean).length + (hasGrid ? 1 : 0);

          return (
            <section key={screen.slug} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-puru-cloud-deep/40 pb-2">
                <h2 className="font-puru-display text-2xl font-semibold leading-puru-tight text-puru-ink-rich">
                  {screen.title}
                </h2>
                <div className="flex items-center gap-3 font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-soft">
                  <span className="rounded-full bg-puru-cloud-bright px-2 py-0.5">
                    {droppedCount === 0
                      ? "no mockups yet"
                      : droppedCount === 1
                        ? "1 dropped"
                        : `${droppedCount} dropped`}
                  </span>
                  <Link
                    href={screen.liveRoute}
                    className="rounded-full bg-puru-honey-tint px-3 py-0.5 text-puru-ink-rich hover:bg-puru-honey-base"
                  >
                    live →
                  </Link>
                </div>
              </div>

              <p className="text-sm leading-puru-normal text-puru-ink-soft">
                {screen.intent}{" "}
                <span className="font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-ghost">
                  prompt: {screen.prompt}
                </span>
              </p>

              {hasGrid ? (
                <div className="flex flex-col gap-2">
                  <span className="font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-ghost">
                    grid.png
                  </span>
                  <div className="relative w-full overflow-hidden rounded-puru-md border border-puru-cloud-dim bg-puru-cloud-bright">
                    <Image
                      src={gridSrc(screen.slug)}
                      alt={`${screen.title} 2×2 mockup grid`}
                      width={2048}
                      height={2048}
                      className="h-auto w-full"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                {VARIANTS.map((v, i) => {
                  const present = tileFlags[i];
                  return (
                    <figure
                      key={v}
                      className="flex flex-col gap-2 rounded-puru-md border border-puru-cloud-dim bg-puru-cloud-bright p-3"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-puru-sm bg-puru-cloud-dim/40">
                        {present ? (
                          <Image
                            src={variantSrc(screen.slug, v)}
                            alt={`${screen.title} variant ${v.toUpperCase()}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-ghost">
                            (drop {v}.png here)
                          </div>
                        )}
                      </div>
                      <figcaption className="flex items-center justify-between font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-soft">
                        <span>variant {v.toUpperCase()}</span>
                        <span className="text-puru-ink-ghost">
                          {present ? "✓ dropped" : "○ pending"}
                        </span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>

              {notes ? (
                <details className="rounded-puru-md border border-puru-cloud-dim bg-puru-honey-tint/40 p-4 open:bg-puru-honey-tint/60">
                  <summary className="cursor-pointer font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-soft">
                    operator notes ({notes.split("\n").length} lines)
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap font-puru-body text-sm leading-puru-normal text-puru-ink-base">
                    {notes}
                  </pre>
                </details>
              ) : (
                <p className="font-puru-mono text-2xs uppercase tracking-wide text-puru-ink-ghost">
                  no notes — drop a notes.md in{" "}
                  <code>public/art/mockups/{screen.slug}/</code> to record your verdict
                </p>
              )}
            </section>
          );
        })}

        <footer className="flex flex-col gap-2 pt-8 text-puru-ink-ghost">
          <p className="font-puru-mono text-2xs uppercase tracking-wide">workflow reminder</p>
          <p className="text-sm leading-puru-normal text-puru-ink-soft">
            1. Run a prompt in ChatGPT image. 2. Drop the return as a 2×2 grid or sliced tiles. 3.
            Refresh this page. 4. Mark favorites. 5. Tell the agent which tile to implement.
          </p>
        </footer>
      </div>
    </main>
  );
}
