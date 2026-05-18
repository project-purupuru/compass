import type { Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { AgentationMount } from "@/components/AgentationMount";
import { AnimatedFavicon } from "@/components/AnimatedFavicon";
import { ThemeBoot } from "@/components/theme/ThemeBoot";
import { rootMetadata, jsonLdWebSite } from "@/lib/seo/metadata";
import { THEME_COOKIE, type ResolvedTheme } from "@/lib/theme/resolve";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Two-channel theme color so the OS browser chrome (Safari address
// bar, Android task switcher) tracks light vs dark without a flash.
// The ThemeBoot script overrides this synchronously when a cookie or
// cache picks the opposite of the system preference.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d4a80a" },
    { media: "(prefers-color-scheme: dark)", color: "#332518" },
  ],
};

// SEO + OG metadata single-source · `lib/seo/metadata.ts`.
// Per-page overrides via `export const metadata = pageMetadata("<slug>")`
// shallow-merge over these defaults.
export const metadata = rootMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side theme read — when the cookie is set (returning visit
  // or post-weather-fetch), SSR HTML carries data-theme already so
  // first paint matches the resolved theme without waiting for the
  // inline script. Cold first visit falls through to ThemeBoot's
  // client-side resolution.
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const initialTheme: ResolvedTheme | undefined =
    cookieTheme === "old-horai" || cookieTheme === "day-horai" ? cookieTheme : undefined;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      // suppressHydrationWarning — ThemeBoot mutates data-theme before
      // React hydrates, so the SSR/CSR markup will diverge by exactly
      // that one attribute. React's warning here would be a false
      // positive; it would also obscure real hydration issues.
      suppressHydrationWarning
      data-theme={initialTheme}
    >
      <head>
        {/* MUST be in <head> and synchronous — running pre-paint is
            the entire point. Placing it before any other client code
            ensures data-theme is set before the body rasterizes. */}
        <ThemeBoot />
      </head>
      <body className="min-h-full flex flex-col font-puru-body text-puru-ink-base">
        {/* WebSite + Organization JSON-LD · helps AI agents + search
            crawlers map the surface · ties @puruworld X handle to the
            canonical site. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdWebSite),
          }}
        />
        <AnimatedFavicon />
        {children}
        {process.env.NODE_ENV === "development" && <AgentationMount />}
      </body>
    </html>
  );
}
