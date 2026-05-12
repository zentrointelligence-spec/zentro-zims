"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Bot,
  CalendarClock,
  FileSpreadsheet,
  MessageCircle,
  Target,
  Wallet,
} from "lucide-react"

const FEATURES = [
  {
    title: "Lead Management",
    description:
      "Capture, track, and qualify leads from any source. Never lose a prospect again.",
    icon: Target,
    gradient: "from-violet-500/20 to-brand-500/20",
    iconColor: "text-violet-400",
  },
  {
    title: "Policy Tracking",
    description:
      "All your policies in one place with automatic expiry tracking and renewal alerts.",
    icon: Wallet,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    title: "Renewal Automation",
    description:
      "Auto-flag policies expiring in 30 days. Create renewal tasks automatically. Never miss a renewal.",
    icon: CalendarClock,
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    title: "WhatsApp Integration",
    description:
      "Send messages, receive replies, and log every conversation — all inside Zentro.",
    icon: MessageCircle,
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400",
  },
  {
    title: "AI Assistant",
    description:
      "Get AI-generated reply suggestions, renewal messages, and birthday wishes in seconds.",
    icon: Bot,
    gradient: "from-brand-500/20 to-violet-500/20",
    iconColor: "text-brand-400",
  },
  {
    title: "Excel Import",
    description:
      "Bring your existing data in minutes. Upload your spreadsheet and Zentro handles the rest.",
    icon: FileSpreadsheet,
    gradient: "from-sky-500/20 to-blue-500/20",
    iconColor: "text-sky-400",
  },
] as const

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section
      ref={ref}
      id="features"
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
            Everything your agency needs
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-slate-400">
            Built specifically for how insurance agencies actually work
          </p>
        </motion.div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-xl border border-white/10 bg-slate-900/30 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg hover:shadow-black/20"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient}`}>
                <f.icon className={`h-6 w-6 ${f.iconColor}`} aria-hidden />
              </div>
              <h3 className="text-lg font-bold tracking-[-0.02em] text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-base leading-[1.7] text-slate-400">{f.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
