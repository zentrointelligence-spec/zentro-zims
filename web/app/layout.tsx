import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@wrksz/themes";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zentro.io"),
  title: {
    default: "Zentro — Insurance agency CRM, built for modern brokers",
    template: "%s · Zentro",
  },
  description:
    "Zentro is a multi-tenant SaaS for insurance agencies: leads, policies, " +
    "renewals, WhatsApp, and AI assistant — one workspace for your whole team.",
  keywords: [
    "insurance CRM",
    "insurance agency software",
    "lead management",
    "policy tracking",
    "renewal automation",
    "WhatsApp insurance",
    "insurance broker tools",
    "SEA insurance",
  ],
  authors: [{ name: "Zentro" }],
  creator: "Zentro",
  publisher: "Zentro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zentro.io",
    title: "Zentro — Insurance agency CRM, built for modern brokers",
    description:
      "Leads, policies, renewals, WhatsApp + AI — one workspace for modern brokers.",
    siteName: "Zentro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zentro Insurance Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zentro — Insurance agency CRM",
    description: "Leads, policies, renewals, WhatsApp + AI — one workspace for modern brokers.",
    images: ["/og-image.png"],
    creator: "@zentro",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: "https://zentro.io",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="zentro-theme"
        >
          <Providers>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </Providers>
        </ThemeProvider>
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
      </body>
    </html>
  );
}
