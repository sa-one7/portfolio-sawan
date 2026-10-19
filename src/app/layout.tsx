import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Saira } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

// Saira is a motorsport face with a width axis, so one family gives the wide headlines
// and the narrow timing-screen labels. Inter carries the reading text.
const display = Saira({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Link previews need the site's full address. Vercel supplies its own, and anywhere else
// NEXT_PUBLIC_SITE_URL can be set to it.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3002");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Sawan Singh · One lap",
  description: "Software Engineer. React on the front end, Node.js behind it. A portfolio you drive: one lap, six corners.",
  openGraph: {
    title: "Sawan Singh · One lap",
    description: "Software Engineer. React on the front end, Node.js behind it.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
};

// Runs before first paint: marks the page as scripted, fits the saved tyre compound, and
// notes a visit where the start lights have already been shown.
const bootScript = `try{var d=document.documentElement;d.classList.add("js");var c=localStorage.getItem("one-lap-compound");if(c)d.dataset.theme=c;if(sessionStorage.getItem("one-lap-seen"))d.dataset.seen="1"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Browser extensions inject their own scripts into <head>, which React can mistake for this one. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
