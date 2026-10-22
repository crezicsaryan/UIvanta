import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/ambient-background";
import { CursorBubble } from "@/components/cursor-bubble";

export const metadata: Metadata = {
  metadataBase: new URL("https://uivanta.app"),
  title: {
    default: "UIvanta — Turn any website into a design.md",
    template: "%s · UIvanta",
  },
  description:
    "Paste a URL or drop a screenshot. UIvanta extracts the design tokens, components, and layout rules behind it, then writes an implementation-ready design.md you can hand to any AI coding agent.",
  keywords: [
    "design.md",
    "design tokens",
    "AI design analysis",
    "website design analyzer",
    "CSS extraction",
    "Cursor",
    "Claude Code",
  ],
  openGraph: {
    title: "UIvanta — Turn any website into a design.md",
    description:
      "From website inspiration to implementation-ready design documentation in minutes.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbf4f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Manrope:wght@400..800&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="antialiased">
        <AmbientBackground />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <div className="relative z-10">{children}</div>
        <CursorBubble />
      </body>
    </html>
  );
}
