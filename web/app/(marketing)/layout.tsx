import type { ReactNode } from "react"

import { Footer } from "@/components/marketing/Footer"
import { MarketingNav } from "@/components/marketing/MarketingNav"
import { NeuronBackground } from "@/components/marketing/NeuronBackground"
import { WaitlistForm } from "@/components/marketing/WaitlistForm"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0e1a] text-white antialiased overflow-x-hidden">
      <NeuronBackground />
      <MarketingNav />
      <div className="relative z-10 flex-1">{children}</div>
      <WaitlistForm variant="sticky" />
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
