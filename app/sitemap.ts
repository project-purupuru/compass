// Next.js auto-generated sitemap.xml at /sitemap.xml.
// Lists the 5 public surfaces · /preview deliberately excluded (it's
// noindex per BEACON R5 spec) along with /demo (recording target).

import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE.url}/quiz`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/today`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];
}
