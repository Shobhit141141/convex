import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Convex — Audience-Aware Landing Page Conversion Grader",
  description:
    "Evidence-based Conversion Rate Optimization (CRO) grader evaluating pages across Persuasion, Execution, and Experience with Playwright verification, AI semantic copy analysis, and 1-to-1 screenshot diagnostics.",
  keywords: [
    "landing page grader",
    "conversion rate optimization",
    "CRO audit",
    "rubric v3",
    "conversion engineering",
    "playwright browser test",
    "copywriting analysis",
    "pagespeed"
  ],
  authors: [{ name: "Convex Engineering" }],
  openGraph: {
    title: "Convex — Audience-Aware Landing Page Conversion Grader",
    description:
      "Evidence-based CRO evaluation engine combining deterministic DOM inspection, AI semantic copy analysis, live browser interaction verification, and screenshot hotspot pinning.",
    url: "https://convex-rosy.vercel.app",
    siteName: "Convex CRO Grader",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Convex — Audience-Aware Landing Page Conversion Grader",
    description:
      "Evidence-based CRO evaluation engine combining deterministic DOM inspection, AI copy review, and live browser verification."
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
