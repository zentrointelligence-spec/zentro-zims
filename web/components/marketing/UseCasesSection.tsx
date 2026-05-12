"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { User, Building2, Landmark } from "lucide-react"

const useCases = [
  {
    icon: User,
    title: "Solo Agents",
    description:
      "Run your entire business from one inbox. Track leads, manage policies, and never miss a renewal — all without hiring a team.",
    features: ["1 user included", "Up to 500 customers", "WhatsApp integration", "Renewal reminders"],
    cta: "Start for free",
    href: "/register",
  },
  {
    icon: Building2,
    title: "Growing Agencies",
    description:
      "Scale your team without the chaos. Assign leads, track commissions, and get visibility into every agent's pipeline.",
    features: ["Up to 10 users", "Unlimited customers", "Team analytics", "Commission tracking"],
    cta: "See Growth plan",
    href: "/pricing",
    featured: true,
  },
  {
    icon: Landmark,
    title: "Enterprise Brokerages",
    description:
      "Multi-branch management with audit trails, API access, and dedicated support. Built for compliance-heavy operations.",
    features: ["Unlimited users", "API access", "SSO & audit logs", "Dedicated support"],
    cta: "Contact sales",
    href: "mailto:hello@zentro.io",
  },
] as const

export function UseCasesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for every agency size
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Whether you&apos;re a solo agent or a multi-branch brokerage, Zentro scales with you.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                "featured" in uc && uc.featured
                  ? "border-brand-500/30 bg-brand-500/5 ring-1 ring-brand-500/20 hover:shadow-brand-500/10"
                  : "border-white/10 bg-slate-900/30 backdrop-blur-sm hover:border-white/20"
              }`}
            >
              {"featured" in uc && uc.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                  "featured" in uc && uc.featured ? "bg-brand-500/20 text-brand-300" : "bg-white/10 text-slate-400"
                }`}
              >
                <uc.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{uc.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{uc.description}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {uc.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={uc.href}
                className={`mt-8 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  "featured" in uc && uc.featured
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {uc.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
