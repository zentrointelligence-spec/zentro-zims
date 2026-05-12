import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@wrksz/themes";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

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
  openGraph: {
    type: "website",
    title: "Zentro Insurance Management",
    description:
      "Leads, policies, renewals, WhatsApp + AI — one workspace for modern brokers.",
    siteName: "Zentro",
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
      </body>
    </html>
  );
}
