// /today · share-target landing page · ambient Action surface for direct
// browser visitors. Blink clients resolve via actions.json rule
// `/today → /api/actions/today`. Twitter crawler reads the OG metadata
// from this page before Dialect registry approval enables native unfurl.

import { pageMetadata } from "@/lib/seo/metadata";
import { BlinkPreview } from "@/components/blink/blink-preview";
import "@/components/blink/blink-styles.css";

export const metadata = pageMetadata("today");

export default function TodayPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purupuru.world";
  const targetUrl = `${baseUrl}/api/actions/today`;

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-puru-cloud-deep p-6 md:p-12 font-puru-body">
      <div className="purupuru-blink-scope w-full max-w-md">
        <BlinkPreview url={targetUrl} stylePreset="x-light" />
      </div>
    </main>
  );
}
