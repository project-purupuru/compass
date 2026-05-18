// /quiz · share-target landing page · what someone sees on direct-paste of
// "purupuru.world/quiz" into a browser (without a Phantom extension or
// Dialect-registered unfurl client).
//
// For Blink clients (Phantom, dial.to, registered X), they fetch
// `/actions.json` FIRST and use the rule `/quiz → /api/actions/quiz/start`
// to resolve the Action JSON. They don't render this HTML. So this page is
// purely a fallback for direct human visitors + carries the OG metadata
// that Twitter's crawler reads when the URL is pasted before Dialect
// registry approval lands.

import { pageMetadata } from "@/lib/seo/metadata";
import { BlinkPreview } from "@/components/blink/blink-preview";
import "@/components/blink/blink-styles.css";

export const metadata = pageMetadata("quiz");

export default function QuizPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purupuru.world";
  const targetUrl = `${baseUrl}/api/actions/quiz/start`;

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-puru-cloud-deep p-6 md:p-12 font-puru-body">
      <div className="purupuru-blink-scope w-full max-w-md">
        <BlinkPreview url={targetUrl} stylePreset="x-light" />
      </div>
    </main>
  );
}
