"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const TIERS = [
  {
    name: "Starter",
    priceLabel: "Free",
    tagline: "Perfect for solo agents getting started",
    featured: false,
    features: [
      "Up to 3 users",
      "100 leads · 50 policies",
      "Lead and policy management",
      "WhatsApp messaging (log only)",
      "Excel import",
      "Email support",
    ],
    cta: "Start free",
    href: "/register" as const,
    external: false,
  },
  {
    name: "Growth",
    priceLabel: "$79",
    priceSuffix: "/ month",
    tagline: "For growing agencies with a full team",
    featured: true,
    features: [
      "Up to 10 users",
      "Unlimited leads and policies",
      "Everything in Starter",
      "Live WhatsApp sending (Twilio)",
      "Birthday and renewal automation",
      "Quotation system",
      "Analytics and reporting",
      "Document storage (5 GB)",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/register" as const,
    external: false,
  },
  {
    name: "Pro",
    priceLabel: "$199",
    priceSuffix: "/ month",
    tagline: "For large agencies and brokers",
    featured: false,
    features: [
      "Unlimited users",
      "Everything in Growth",
      "WhatsApp broadcast campaigns",
      "AI content generation",
      "Audit logs",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact us",
    href: "mailto:hello@zentro.io" as const,
    external: true,
  },
] as const

export function PricingSection({ id = "pricing" }: { id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      id={id}
      className="border-b border-white/5 bg-transparent px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-slate-400">
            Start free. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
          {TIERS.map((tier, i) => (
            <motion.article
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "group relative flex flex-col rounded-2xl border p-8 shadow-sm backdrop-blur-sm transition-all duration-300",
                tier.featured
                  ? "border-indigo-500/50 bg-indigo-950/50 ring-1 ring-indigo-500/30 hover:ring-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 lg:z-10 lg:scale-105 hover:lg:scale-[1.07]"
                  : "border-white/10 bg-slate-900/30 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg hover:shadow-black/30",
              )}
            >
              {tier.featured && (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30">
                  Most popular
                </p>
              )}
              <div>
                <h3 className="text-xl font-bold tracking-[-0.02em] text-white">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{tier.tagline}</p>
                <div className="mt-6 flex items-end gap-1">
                  <p className="text-4xl font-bold tracking-tight text-white">
                    {tier.priceLabel}
                  </p>
                  {"priceSuffix" in tier && (
                    <p className="mb-1 text-sm text-slate-400">{tier.priceSuffix}</p>
                  )}
                </div>
              </div>

              <ul className="mt-8 flex-1 space-y-3 text-sm leading-relaxed text-slate-300">
                {tier.features.map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        tier.featured ? "text-indigo-400" : "text-emerald-500",
                      )}
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {tier.external ? (
                  <a
                    href={tier.href}
                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <Link
                    href={tier.href}
                    className={cn(
                      "block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-all active:scale-[0.98]",
                      tier.featured
                        ? "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                        : "bg-indigo-600/80 hover:bg-indigo-600",
                    )}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
