// Demo recording surface · current X.com (2026) 3-column faithful layout.
//
// Design call: operator override of constructs' "palette-as-disclaimer" stance.
// Audience must recognize "this is what users see in their X feed" without
// ambiguity. Voiceover frames it honestly + the Blink card itself stays in
// the cream/honey wuxing palette as the focal artifact (clearly OURS).
//
// Reference: actual X.com light-mode screenshot · 2026-05-10.
//
// Layout:
//   Left sidebar  (~275px) · X mark · Home (pill-active) / Explore /
//     Notifications / Chat / SuperGrok / Premium+ / Bookmarks /
//     Creator Studio / Articles / Profile / More · Post · account
//   Main feed     (~600px) · header tabs (For you · Following · custom) ·
//     compose + action icons · Show N posts · neighbor post · focal post
//     (Blink) · neighbor posts
//   Right sidebar (~350px) · search · Today's News · What's happening ·
//     Who to follow · footer
//
// X palettes — both modes are X's actual chrome (verified against the
// 2026-05-10 reference screenshot for light, and X's "Lights out"
// dark mode for dark). Mode resolves from the puru-theme cookie set
// by ObservatoryClient after the weather feed lands · pre-paint via
// the inline ThemeBoot script · server-read here so the SSR HTML
// already carries the right chrome.
//
// X light-mode palette (2026):
//   bg              #ffffff
//   surface (cards) #f7f9f9
//   hover           #eff3f4
//   hairline        #eff3f4
//   text-primary    #0f1419
//   text-secondary  #536471
//   text-tertiary   #7c8b96
//   accent          #1d9bf0  (links · active underline · Post button)
//   verified        #1d9bf0
//   pill-active-bg  #eff3f4
//
// X dark-mode palette ("Lights out" · OLED black · 2026):
//   bg              #000000
//   surface (cards) #16181c
//   hover           #1d1f23
//   hairline        #2f3336
//   text-primary    #e7e9ea
//   text-secondary  #71767b
//   text-tertiary   #5d6063
//   accent          #1d9bf0  (carries across both modes — X's blue is
//                              the one constant; matches the verified
//                              badge color)
//   pill-active-bg  #16181c

import { cookies } from "next/headers";
import { THEME_COOKIE, type ResolvedTheme } from "@/lib/theme/resolve";
import {
  Bell,
  Bot,
  BookmarkPlus,
  Bookmark,
  CalendarClock,
  Check,
  Diamond,
  FileText,
  Heart,
  Home,
  ImageIcon,
  ListChecks,
  MapPin,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Repeat2,
  Rocket,
  Search,
  Smile,
  Upload,
  User as UserIcon,
  X as CloseIcon,
} from "lucide-react";

import { BlinkPreview } from "@/components/blink/blink-preview";
import { pageMetadata } from "@/lib/seo/metadata";
import "@/components/blink/blink-styles.css";

export const metadata = pageMetadata("demo");

interface PageProps {
  searchParams: Promise<{ url?: string; style?: string }>;
}

const STYLE_PRESETS = ["default", "x-dark", "x-light"] as const;
type StylePreset = (typeof STYLE_PRESETS)[number];

// Loose icon-component type · covers both Lucide forward-ref components
// and our custom inline SVG glyphs (e.g. ViewsGlyph) without TS friction.
type IconType = React.ComponentType<{ size?: number; strokeWidth?: number }>;

// X palette · referenced as CSS custom properties so a single
// theme-scoped style block on <main> drives the whole tree without
// every helper component needing to take a `palette` prop. The hex
// values live in X_LIGHT / X_DARK below; XC stays as the
// var()-pointer surface that the helpers consume.
const XC = {
  bg: "var(--x-bg)",
  surface: "var(--x-surface)",
  hover: "var(--x-hover)",
  hairline: "var(--x-hairline)",
  hairlineStrong: "var(--x-hairline-strong)",
  textPrimary: "var(--x-text-primary)",
  textSecondary: "var(--x-text-secondary)",
  textTertiary: "var(--x-text-tertiary)",
  accent: "var(--x-accent)",
  accentText: "var(--x-accent-text)",
  pillActiveBg: "var(--x-pill-active-bg)",
} as const;

// Real hex values for both modes. The CSSProperties object below
// gets spread onto <main style={...}> so the cascade lights up.
const X_LIGHT = {
  "--x-bg": "#ffffff",
  "--x-surface": "#f7f9f9",
  "--x-hover": "#eff3f4",
  "--x-hairline": "#eff3f4",
  "--x-hairline-strong": "#cfd9de",
  "--x-text-primary": "#0f1419",
  "--x-text-secondary": "#536471",
  "--x-text-tertiary": "#7c8b96",
  "--x-accent": "#1d9bf0",
  "--x-accent-text": "#ffffff",
  "--x-pill-active-bg": "#eff3f4",
} as const;

const X_DARK = {
  "--x-bg": "#000000",
  "--x-surface": "#16181c",
  "--x-hover": "#1d1f23",
  "--x-hairline": "#2f3336",
  "--x-hairline-strong": "#3e4144",
  "--x-text-primary": "#e7e9ea",
  "--x-text-secondary": "#71767b",
  "--x-text-tertiary": "#5d6063",
  "--x-accent": "#1d9bf0",
  // On dark, the Post button (text on accent) stays white — matches X.
  "--x-accent-text": "#ffffff",
  "--x-pill-active-bg": "#16181c",
} as const;

function xPaletteFor(theme: ResolvedTheme): React.CSSProperties {
  return (theme === "old-horai" ? X_DARK : X_LIGHT) as React.CSSProperties;
}

// X brand mark (operator-provided 2026-05-10).
function XMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-label="X"
    >
      <title>X</title>
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

// Verified badge · X's blue checkmark.
function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} aria-label="verified" className="shrink-0">
      <path
        fill={XC.accent}
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}

// Official X SuperGrok glyph (X.com 2026 source · operator-paste).
// Used in left-nav + next to every post (the small "Grok" diamond on X).
function SuperGrokIcon({ size = 26 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 33 32" width={size} height={size} aria-hidden fill="currentColor">
      <path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466" />
    </svg>
  );
}

// Official X Premium+ verified-badge-ish glyph (X.com 2026 source · operator-paste).
function PremiumIcon({ size = 26 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor">
      <path d="M8.52 3.59c.8-1.1 2.04-1.84 3.48-1.84s2.68.74 3.49 1.84c1.34-.21 2.74.14 3.76 1.16s1.37 2.42 1.16 3.77c1.1.8 1.84 2.04 1.84 3.48s-.74 2.68-1.84 3.48c.21 1.34-.14 2.75-1.16 3.77s-2.42 1.37-3.76 1.16c-.8 1.1-2.05 1.84-3.49 1.84s-2.68-.74-3.48-1.84c-1.34.21-2.75-.14-3.77-1.16-1.01-1.02-1.37-2.42-1.16-3.77-1.09-.8-1.84-2.04-1.84-3.48s.75-2.68 1.84-3.48c-.21-1.35.14-2.75 1.16-3.77s2.43-1.37 3.77-1.16zm3.48.16c-.85 0-1.66.53-2.12 1.43l-.38.77-.82-.27c-.96-.32-1.91-.12-2.51.49-.6.6-.8 1.54-.49 2.51l.27.81-.77.39c-.9.46-1.43 1.27-1.43 2.12s.53 1.66 1.43 2.12l.77.39-.27.81c-.31.97-.11 1.91.49 2.51.6.61 1.55.81 2.51.49l.82-.27.38.77c.46.9 1.27 1.43 2.12 1.43s1.66-.53 2.12-1.43l.39-.77.82.27c.96.32 1.9.12 2.51-.49.6-.6.8-1.55.48-2.51l-.26-.81.76-.39c.91-.46 1.43-1.27 1.43-2.12s-.52-1.66-1.43-2.12l-.77-.39.27-.81c.32-.97.12-1.91-.48-2.51-.61-.61-1.55-.81-2.51-.49l-.82.27-.39-.77c-.46-.9-1.27-1.43-2.12-1.43zm4.74 5.68l-6.2 6.77-3.74-3.74 1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36z" />
    </svg>
  );
}

// Small Grok glyph for per-post header (smaller size variant of SuperGrokIcon).
function GrokDiamond({ size = 18 }: { size?: number }) {
  return (
    <span style={{ color: XC.textSecondary, display: "inline-flex" }}>
      <SuperGrokIcon size={size} />
    </span>
  );
}

// @puruworld avatar · operator's profile picture (IMG_8637.png · 2026-05-10).
function PuruAvatar({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/puruworld-avatar.png"
      alt="purupuru"
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

// Image-backed avatar · used for character art + brand logos.
function ImageAvatar({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

// Left-nav row · pill-active variant matches current X.
// Symmetric px-4 py-3 — pill feels like a balanced button (#3).
// Unread dot removed (#2) — clean Home icon when active.
function NavItem({
  Icon,
  label,
  active = false,
}: {
  Icon: IconType;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-full cursor-pointer self-start"
      style={{
        color: XC.textPrimary,
        backgroundColor: active ? XC.pillActiveBg : "transparent",
      }}
    >
      <Icon size={26} strokeWidth={active ? 2.25 : 1.75} />
      <span className="text-[20px]" style={{ fontWeight: active ? 700 : 400 }}>
        {label}
      </span>
    </div>
  );
}

// Action rail metric · current X format (icon + count, K abbreviation).
function Metric({
  Icon,
  count,
  color = XC.textSecondary,
}: {
  Icon: IconType;
  count: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[13px]" style={{ color }}>
      <Icon size={18} strokeWidth={1.75} />
      {count && <span>{count}</span>}
    </div>
  );
}

// View-count glyph: a small bar chart silhouette.
function ViewsGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.75 21V3h2v18zM18 21V8.5h2V21zM4 21l.004-10h2L6 21zM13.5 21v-7h2v7z" />
    </svg>
  );
}

// Reusable post row (neighbors above/below the focal post).
// `automatedBy` prop renders the X "Automated by @handle" badge below the
// account row · used for in-world AI-agent posts that announce element
// shifts / weather / world-updates in Gumi's voice. Models @aixbt_agent ·
// drives cold scrollers toward the quiz via ambient world-pulse.
function Post({
  avatar,
  name,
  handle,
  time,
  verified = false,
  automatedBy,
  body,
  metrics,
}: {
  avatar: React.ReactNode;
  name: string;
  handle: string;
  time: string;
  verified?: boolean;
  automatedBy?: string;
  body: React.ReactNode;
  metrics: { reply: string; repost: string; like: string; views: string };
}) {
  return (
    <article
      className="flex gap-3 px-4 py-3.5"
      style={{ borderBottom: `1px solid ${XC.hairline}` }}
    >
      {avatar}
      <div className="flex-1 min-w-0">
        {automatedBy ? (
          /* Agent layout · single-row head (matches standard X post header).
             whitespace-nowrap on each text span prevents the longest names
             (e.g. "tsuheji winds" + "@tsuhejiwinds") from wrapping when
             flex auto-shrinks the items. */
          <>
            <div className="flex items-center gap-x-1 text-[15px]">
              <span className="font-bold whitespace-nowrap" style={{ color: XC.textPrimary }}>
                {name}
              </span>
              {verified && <VerifiedBadge size={16} />}
              <span className="whitespace-nowrap" style={{ color: XC.textSecondary }}>
                @{handle}
              </span>
              <span style={{ color: XC.textSecondary }}>·</span>
              <span className="whitespace-nowrap" style={{ color: XC.textSecondary }}>
                {time}
              </span>
              <div className="ml-auto flex items-center gap-3 shrink-0">
                <GrokDiamond size={16} />
                <MoreHorizontal size={18} style={{ color: XC.textSecondary }} />
              </div>
            </div>
            <div
              className="mt-0.5 flex items-center gap-1.5 text-[13px]"
              style={{ color: XC.textSecondary }}
            >
              <Bot size={14} strokeWidth={1.75} />
              <span>
                Automated by <span style={{ color: XC.accent }}>@{automatedBy}</span>
              </span>
            </div>
          </>
        ) : (
          /* Standard X single-row layout · name + verified + @handle + time
             on one line · grok diamond + menu on far right. */
          <div className="flex items-center gap-x-1 text-[15px]">
            <span className="font-bold" style={{ color: XC.textPrimary }}>
              {name}
            </span>
            {verified && <VerifiedBadge size={16} />}
            <span style={{ color: XC.textSecondary }}>@{handle}</span>
            <span style={{ color: XC.textSecondary }}>·</span>
            <span style={{ color: XC.textSecondary }}>{time}</span>
            <div className="ml-auto flex items-center gap-3">
              <GrokDiamond size={16} />
              <MoreHorizontal size={18} style={{ color: XC.textSecondary }} />
            </div>
          </div>
        )}
        <div
          className={`${automatedBy ? "mt-1" : "mt-0.5"} text-[15px] leading-[1.35]`}
          style={{ color: XC.textPrimary }}
        >
          {body}
        </div>
        <PostActionRail metrics={metrics} />
      </div>
    </article>
  );
}

// 5-item action rail (reply · repost · like · views · bookmark + share).
// More breathing room between action rail and next-post border (#4).
function PostActionRail({
  metrics,
}: {
  metrics: { reply: string; repost: string; like: string; views: string };
}) {
  return (
    <div className="mt-4 flex items-center max-w-[440px]">
      <div className="flex-1">
        <Metric Icon={MessageCircle} count={metrics.reply} />
      </div>
      <div className="flex-1">
        <Metric Icon={Repeat2} count={metrics.repost} />
      </div>
      <div className="flex-1">
        <Metric Icon={Heart} count={metrics.like} />
      </div>
      <div className="flex-1">
        <Metric Icon={ViewsGlyph} count={metrics.views} />
      </div>
      <div className="flex items-center gap-3">
        <BookmarkPlus size={18} strokeWidth={1.75} style={{ color: XC.textSecondary }} />
        <Upload size={18} strokeWidth={1.75} style={{ color: XC.textSecondary }} />
      </div>
    </div>
  );
}

// Today's News item · 3 stacked avatars + meta.
function NewsItem({ headline, meta, hues }: { headline: string; meta: string; hues: number[] }) {
  return (
    <div className="px-4 py-3 cursor-pointer">
      <div className="text-[15px] font-bold leading-[1.3]" style={{ color: XC.textPrimary }}>
        {headline}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex -space-x-2">
          {hues.map((h, i) => (
            <div
              key={i}
              className="size-5 rounded-full border-2"
              style={{
                backgroundColor: `oklch(0.55 0.10 ${h})`,
                borderColor: XC.bg,
              }}
            />
          ))}
        </div>
        <span className="text-[13px]" style={{ color: XC.textSecondary }}>
          {meta}
        </span>
      </div>
    </div>
  );
}

function Trend({ category, topic, meta }: { category: string; topic: string; meta?: string }) {
  return (
    <div className="px-4 py-2 cursor-pointer flex justify-between items-start">
      <div>
        <div className="text-[13px]" style={{ color: XC.textSecondary }}>
          {category}
        </div>
        <div
          className="text-[15px] font-bold mt-0.5 leading-tight"
          style={{ color: XC.textPrimary }}
        >
          {topic}
        </div>
        {meta && (
          <div className="text-[13px] mt-0.5" style={{ color: XC.textSecondary }}>
            {meta}
          </div>
        )}
      </div>
      <MoreHorizontal size={16} style={{ color: XC.textSecondary }} className="shrink-0 mt-1" />
    </div>
  );
}

function FollowSuggestion({
  src,
  name,
  handle,
  verified = false,
}: {
  src: string;
  name: string;
  handle: string;
  verified?: boolean;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <ImageAvatar src={src} alt={name} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <div
            className="text-[15px] font-bold leading-tight truncate"
            style={{ color: XC.textPrimary }}
          >
            {name}
          </div>
          {verified && <VerifiedBadge size={16} />}
        </div>
        <div className="text-[14px] truncate" style={{ color: XC.textSecondary }}>
          @{handle}
        </div>
      </div>
      <button
        type="button"
        className="px-4 py-1.5 rounded-full text-[14px] font-bold"
        style={{
          backgroundColor: XC.textPrimary,
          color: XC.bg,
        }}
      >
        Follow
      </button>
    </div>
  );
}

export default async function DemoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // `||` (not `??`) so empty string from a misconfigured env var also falls
  // back · prevents the `new URL()` invalid-URL crash in @dialectlabs/blinks
  // when NEXT_PUBLIC_APP_URL is set but blank.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const targetUrl = params.url || `${baseUrl}/api/actions/quiz/start`;

  // Theme resolution priority for the X chrome:
  //   1. ?style=x-dark | x-light — explicit operator override (kept
  //      from before · the recording surface needs to lock to one
  //      mode regardless of the visitor's system pref)
  //   2. puru-theme cookie — set by ObservatoryClient after the
  //      weather feed lands · cookie is the SSR-readable signal
  //   3. x-light default — matches the prior behavior on cold
  //      first visit before the inline ThemeBoot script can run
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const resolvedTheme: ResolvedTheme =
    params.style === "x-dark"
      ? "old-horai"
      : params.style === "x-light"
        ? "day-horai"
        : cookieTheme === "old-horai"
          ? "old-horai"
          : "day-horai";

  // Pass through to the focal Blink card · `default` lets BlinkPreview
  // pick its own surface; `x-dark`/`x-light` force a Blink-side flip.
  // We intentionally don't auto-flip the Blink — the cream/honey card
  // is the focal artifact and its warmth is the contrast we want
  // against either chrome.
  const stylePreset: StylePreset = STYLE_PRESETS.find((p) => p === params.style) ?? "default";

  return (
    <main
      className="min-h-dvh w-full overflow-y-auto font-puru-body"
      // Spread the X palette as CSS custom properties so every helper
      // component below — NavItem, Post, NewsItem, etc — picks up the
      // resolved chrome through XC's var() pointers without any prop
      // drilling. backgroundColor + color reference the same vars so
      // the whole sheet flips in one place.
      style={{
        ...xPaletteFor(resolvedTheme),
        backgroundColor: XC.bg,
        color: XC.textPrimary,
      }}
    >
      {/* 3-column always-on · recording surface · operator drives viewport.
          min-w-[1280px] keeps the layout structurally faithful even when the
          browser window is narrower; horizontal scroll appears naturally,
          which is the right behavior for an X-faithful render. */}
      <div className="mx-auto flex max-w-[1280px] min-w-[1280px]">
        {/* ────────────── LEFT SIDEBAR · 275px ────────────── */}
        <aside className="flex flex-col w-[275px] shrink-0 sticky top-0 h-dvh px-4 py-1 items-stretch">
          <div className="px-4 py-3" style={{ color: XC.textPrimary }}>
            <XMark size={30} />
          </div>
          <nav className="flex flex-col">
            <NavItem Icon={Home} label="Home" active />
            <NavItem Icon={Search} label="Explore" />
            <NavItem Icon={Bell} label="Notifications" />
            <NavItem Icon={MessagesSquare} label="Chat" />
            <NavItem Icon={SuperGrokIcon} label="SuperGrok" />
            <NavItem Icon={PremiumIcon} label="Premium+" />
            <NavItem Icon={Bookmark} label="Bookmarks" />
            <NavItem Icon={Rocket} label="Creator Studio" />
            <NavItem Icon={FileText} label="Articles" />
            <NavItem Icon={UserIcon} label="Profile" />
            <NavItem Icon={MoreHorizontal} label="More" />
          </nav>
          <button
            type="button"
            className="mt-4 mx-3 py-3.5 rounded-full text-[17px] font-bold transition-colors"
            style={{ backgroundColor: XC.textPrimary, color: XC.bg }}
          >
            Post
          </button>
          {/* Account · bottom-pinned */}
          <div className="mt-auto mb-3 mx-2 flex items-center gap-3 px-2 py-2 rounded-full">
            <PuruAvatar size={40} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[15px] font-bold leading-tight truncate"
                style={{ color: XC.textPrimary }}
              >
                purupuru
              </div>
              <div className="text-[13px] truncate" style={{ color: XC.textSecondary }}>
                @puruworld
              </div>
            </div>
            <MoreHorizontal size={18} style={{ color: XC.textSecondary }} />
          </div>
        </aside>

        {/* ────────────── MAIN FEED · 600px ────────────── */}
        <section
          className="flex-1 max-w-[600px] min-w-0"
          style={{
            borderLeft: `1px solid ${XC.hairline}`,
            borderRight: `1px solid ${XC.hairline}`,
          }}
        >
          {/* Header · horizontal tabs (matches current X) */}
          <header
            className="sticky top-0 backdrop-blur-md z-10"
            style={{
              // 85% bg + transparent — was `${XC.bg}d9` (hex+alpha)
              // before XC routed through var(); color-mix is the
              // var()-friendly equivalent of the same opacity.
              backgroundColor: `color-mix(in srgb, ${XC.bg} 85%, transparent)`,
              borderBottom: `1px solid ${XC.hairline}`,
            }}
          >
            <div className="flex items-center overflow-x-auto">
              {/* ALEXANDER R4 audit · dropped fabricated "purupuru" custom tab.
                  Naming our world in the X chrome telegraphs "this is mocked"
                  before the Blink itself speaks. The Blink earns its place by
                  being IN the feed, not by being named in the navigation. */}
              {[
                { label: "For you", active: true },
                { label: "Following" },
                { label: "Solana" },
                { label: "Web3" },
                { label: "+", icon: true },
              ].map((tab) => (
                <div
                  key={tab.label}
                  className="relative flex-1 min-w-fit text-center py-4 px-4 cursor-pointer whitespace-nowrap"
                >
                  <span
                    className="text-[15px]"
                    style={{
                      color: tab.active ? XC.textPrimary : XC.textSecondary,
                      fontWeight: tab.active ? 700 : 500,
                    }}
                  >
                    {tab.label}
                  </span>
                  {tab.active && (
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-14 rounded-full"
                      style={{ backgroundColor: XC.accent }}
                    />
                  )}
                </div>
              ))}
            </div>
          </header>

          {/* Compose */}
          <div
            className="flex gap-3 px-4 py-3"
            style={{ borderBottom: `1px solid ${XC.hairline}` }}
          >
            <PuruAvatar size={40} />
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="What's happening?"
                readOnly
                className="bg-transparent outline-none text-[20px] py-2 w-full"
                style={{ color: XC.textSecondary }}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3" style={{ color: XC.accent }}>
                  <ImageIcon size={20} strokeWidth={1.75} />
                  <span
                    className="text-[13px] font-bold border rounded px-1"
                    style={{ borderColor: XC.accent }}
                  >
                    GIF
                  </span>
                  <ListChecks size={20} strokeWidth={1.75} />
                  <Smile size={20} strokeWidth={1.75} />
                  <CalendarClock size={20} strokeWidth={1.75} />
                  <MapPin size={20} strokeWidth={1.75} />
                </div>
                <button
                  type="button"
                  className="px-5 py-1.5 rounded-full text-[14px] font-bold opacity-50"
                  style={{
                    backgroundColor: XC.accent,
                    color: XC.accentText,
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Show N posts (X's "new posts available" link) */}
          <div
            className="text-center py-3 cursor-pointer text-[15px]"
            style={{
              color: XC.accent,
              borderBottom: `1px solid ${XC.hairline}`,
            }}
          >
            Show 12 posts
          </div>

          {/* Neighbor post above · Eileen (project lead). */}
          <Post
            avatar={<ImageAvatar src="/brand/characters/bear-02.png" alt="eileen" size={40} />}
            name="eileen"
            handle="eileenbtc"
            time="3h"
            verified
            body="the air is heavy today. maybe the metal hour rounds back early this year."
            metrics={{ reply: "12", repost: "4", like: "87", views: "2.1K" }}
          />

          {/* Ambient AI agent · tsuheji winds · automated by @puruworld.
              Models the @aixbt_agent shape — automated world-pulse account
              posting in KAORI's voice (HERALD R5 voice-profile audit
              2026-05-10): dawn-paced tending, short patient sentences,
              periods only, verbs of attention (tends/listens/remembers),
              hopeful-not-bright register. Drives cold scrollers toward the
              quiz via ambient hints, never marketing CTAs.

              Voice catalog for operator extension (per HERALD):
                · Metal-hour shift: "The metal hour has come. Edges are
                  settling, breath is sharper, and twelve souls have turned
                  toward it without being asked."
                · Dusk weather pivot: "Dusk is folding water into the
                  valley. The wind has changed its mind about the storm,
                  and the lanterns will hold tonight."
                · Element-distribution: "Wood is the quiet majority this
                  morning. Fire is two behind, earth is patient as ever,
                  and metal is waking up slow." */}
          <Post
            avatar={
              <ImageAvatar src="/brand/characters/chibi-kaori.png" alt="tsuheji winds" size={40} />
            }
            name="tsuheji winds"
            handle="tsuhejiwinds"
            time="32m"
            verified
            automatedBy="puruworld"
            body="The wood tide is rising. Forty-seven puruhani have read themselves in since first light, and the cedars are listening."
            metrics={{ reply: "8", repost: "21", like: "164", views: "3.8K" }}
          />

          {/* ─── FOCAL POST · the Blink ─── */}
          <article
            className="flex gap-3 px-4 py-3"
            style={{ borderBottom: `1px solid ${XC.hairline}` }}
          >
            <PuruAvatar size={40} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-x-1 text-[15px]">
                <span className="font-bold" style={{ color: XC.textPrimary }}>
                  purupuru
                </span>
                <VerifiedBadge size={16} />
                <span style={{ color: XC.textSecondary }}>@puruworld</span>
                <span style={{ color: XC.textSecondary }}>·</span>
                <span style={{ color: XC.textSecondary }}>2h</span>
                <div className="ml-auto flex items-center gap-3">
                  <GrokDiamond size={16} />
                  <MoreHorizontal size={18} style={{ color: XC.textSecondary }} />
                </div>
              </div>
              <p className="mt-0.5 text-[15px] leading-[1.35]" style={{ color: XC.textPrimary }}>
                eight questions to read you back.
              </p>

              {/* The Blink card · cream/honey palette pops against X white bg ·
                  framed like X's quote-card embed (rounded + hairline border).
                  .demo-blink-scope hides the unregistered-Action warning. */}
              {/* ALEXANDER R4 audit · honey-dim border (was XC.hairlineStrong
                  gray which read as "X embed quote-card"). The warm ring
                  registers as "this card is from elsewhere" — exactly the
                  read we want. Honey-glow shadow does the rest. */}
              <div
                className="purupuru-blink-scope demo-blink-scope mt-3 overflow-hidden rounded-2xl"
                style={{ border: `1px solid var(--puru-honey-dim)` }}
              >
                <BlinkPreview url={targetUrl} stylePreset={stylePreset} />
              </div>

              <PostActionRail metrics={{ reply: "48", repost: "23", like: "412", views: "8.4K" }} />
            </div>
          </article>

          {/* Neighbor posts below */}
          {/* Gumi (artist) · post body matches the drawing/wood-season copy. */}
          <Post
            avatar={<ImageAvatar src="/brand/characters/bear-03.png" alt="gumi" size={40} />}
            name="gumi"
            handle="gumibrews"
            time="5h"
            body="drawing all morning. wood season has me restless."
            metrics={{ reply: "3", repost: "2", like: "54", views: "1.4K" }}
          />
          {/* Zerker (builder/dev) · threshold copy fits the technical voice. */}
          <Post
            avatar={<ImageAvatar src="/brand/characters/bear-01.png" alt="zerker" size={40} />}
            name="zerker"
            handle="zksoju"
            time="8h"
            body="every game starts at the threshold."
            metrics={{ reply: "18", repost: "9", like: "203", views: "5.6K" }}
          />
        </section>

        {/* ────────────── RIGHT SIDEBAR · 350px ────────────── */}
        <aside className="flex flex-col w-[350px] shrink-0 px-6 py-2 gap-4">
          {/* Search */}
          <div
            className="sticky top-2 flex items-center gap-3 px-4 py-2.5 rounded-full"
            style={{ backgroundColor: XC.surface }}
          >
            <Search size={18} style={{ color: XC.textSecondary }} />
            <input
              type="text"
              placeholder="Search"
              readOnly
              className="bg-transparent outline-none text-[15px] flex-1"
              style={{ color: XC.textPrimary }}
            />
          </div>

          {/* Today's News */}
          <div className="rounded-2xl" style={{ backgroundColor: XC.surface }}>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <div className="text-[20px] font-bold" style={{ color: XC.textPrimary }}>
                Today&apos;s News
              </div>
              <CloseIcon size={18} style={{ color: XC.textSecondary }} />
            </div>
            <NewsItem
              headline="Solana Frontier hackathon enters final 48 hours"
              meta="Trending now · Other · 1,204 posts"
              hues={[200, 30, 150]}
            />
            <NewsItem
              headline="Dialect rolls out new Blink registry tier"
              meta="3 hours ago · Web3 · 3,849 posts"
              hues={[260, 45, 200]}
            />
            <NewsItem
              headline="On-chain identity rituals gain traction in social apps"
              meta="19 hours ago · Other · 869 posts"
              hues={[330, 200, 80]}
            />
          </div>

          {/* What's happening */}
          <div className="rounded-2xl py-3" style={{ backgroundColor: XC.surface }}>
            <div className="px-4 text-[20px] font-bold pb-2" style={{ color: XC.textPrimary }}>
              What&apos;s happening
            </div>
            <Trend category="Crypto · Trending" topic="$SOL" meta="Trending with Solana, Phantom" />
            <Trend category="Web3 · Trending" topic="#SolanaFrontier" meta="8,742 posts" />
            <Trend category="Trending" topic="Genesis Stones" meta="1,247 posts" />
            <div className="px-4 pt-2 text-[15px] cursor-pointer" style={{ color: XC.accent }}>
              Show more
            </div>
          </div>

          {/* Who to follow */}
          <div className="rounded-2xl py-3" style={{ backgroundColor: XC.surface }}>
            <div className="px-4 text-[20px] font-bold pb-2" style={{ color: XC.textPrimary }}>
              Who to follow
            </div>
            <FollowSuggestion
              src="/brand/solana-avatar.jpg"
              name="Solana"
              handle="solana"
              verified
            />
            <FollowSuggestion
              src="/brand/dialect-avatar.jpg"
              name="Dialect"
              handle="saydialect"
              verified
            />
            <FollowSuggestion
              src="/brand/colosseum-avatar.jpg"
              name="Colosseum"
              handle="colosseum"
              verified
            />
            <div className="px-4 pt-2 text-[15px] cursor-pointer" style={{ color: XC.accent }}>
              Show more
            </div>
          </div>

          <div className="px-4 text-[13px] leading-[1.4]" style={{ color: XC.textTertiary }}>
            Terms of Service · Privacy Policy · Cookie Policy · Accessibility · Ads info · More · ©
            2026 X Corp.
          </div>
        </aside>
      </div>
    </main>
  );
}
