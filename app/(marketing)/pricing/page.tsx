import type { Metadata } from "next";

import { CtaSection } from "@/components/marketing/CtaSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { PricingSection } from "@/components/marketing/PricingSection";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing — Zentro",
  description:
    "Simple, transparent pricing for insurance agencies. Start free on Starter, upgrade to Growth or Pro when you are ready.",
  openGraph: {
    title: "Zentro pricing — Start free, scale with your agency",
    description:
      "Starter is free forever. Growth and Pro add WhatsApp automation, renewals, analytics, and more.",
    type: "website",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <main>
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
}
