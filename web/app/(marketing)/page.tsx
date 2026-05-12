import type { Metadata } from "next"

import { HeroSection } from "@/components/marketing/HeroSection"
import { StatsBar } from "@/components/marketing/StatsBar"
import { LogoCloud } from "@/components/marketing/LogoCloud"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { UseCasesSection } from "@/components/marketing/UseCasesSection"
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection"
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection"
import { PricingSection } from "@/components/marketing/PricingSection"
import { FaqSection } from "@/components/marketing/FaqSection"
import { CtaSection } from "@/components/marketing/CtaSection"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Zentro — Insurance agency platform for leads, renewals & WhatsApp",
  description:
    "The all-in-one platform for modern insurance agencies. Manage leads, automate renewals, chat on WhatsApp, and close more deals — all in one place.",
  openGraph: {
    title: "Zentro — The all-in-one platform for modern insurance agencies",
    description:
      "Stop losing renewals. Start growing your agency with Zentro — leads, policies, renewals, and WhatsApp in one workspace.",
    type: "website",
    url: "/",
  },
}

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <LogoCloud />
      <FeaturesSection />
      <UseCasesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
