"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Play, Zap, TrendingUp, Users, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { LazyAnimatedDemo, LazyDemoModal } from "./LazySections"
import { WaitlistForm } from "./WaitlistForm"
import { trackCTA, trackDemo } from "@/lib/analytics"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

function FloatingStatsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-10 max-w-sm"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-white/5"
      >
        {/* Mini browser dots */}
        <div className="mb-3 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-400/60" />
          <div className="h-2 w-2 rounded-full bg-amber-400/60" />
          <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
          <div className="ml-2 h-1.5 w-28 rounded-full bg-white/5" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Active Leads", value: "1,247", icon: Users, color: "text-brand-400", bg: "bg-brand-500/10", delta: "+12%" },
            { label: "Renewals", value: "24", icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/10", delta: "due soon" },
            { label: "Revenue", value: "$48k", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", delta: "+8.4%" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-lg ${stat.bg} p-2.5`}>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color} mb-1`} />
              <p className="text-sm font-bold text-white">{stat.value}</p>
              <p className="text-[9px] text-slate-400">{stat.label}</p>
              <p className={`text-[9px] font-medium ${stat.color}`}>{stat.delta}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <p className="text-[11px] text-emerald-300">Policy #4821 renewal sent via WhatsApp</p>
        </div>

        {/* Inner glow */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/5 to-transparent" />
      </motion.div>
    </motion.div>
  )
}

export function HeroSection() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
      {/* Background mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/[0.06] blur-[140px]" />
        <div className="absolute top-20 right-0 h-[500px] w-[600px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[500px] rounded-full bg-indigo-500/[0.03] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          {/* Pill badge */}
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 ring-1 ring-brand-500/30">
              <Zap className="h-3.5 w-3.5" />
              Now with AI-powered renewal predictions
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]"
          >
            Run your insurance agency{" "}
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-brand-400 bg-clip-text text-transparent">
              on autopilot
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 text-lg leading-8 text-slate-300"
          >
            Zentro brings leads, customers, policies, and renewals into one
            intelligent workspace. Never miss a renewal. Never lose a lead.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              onClick={() => trackCTA("start_free", "hero_primary")}
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-500 hover:shadow-brand-500/40 hover:shadow-xl active:scale-[0.98]"
            >
              Start free today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => {
                trackDemo("play")
                setDemoOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
            >
              <Play className="h-4 w-4 text-slate-400" />
              Watch demo
            </button>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div variants={item} className="mt-8">
            <WaitlistForm variant="hero" />
          </motion.div>

          {/* Trust micro-line */}
          <motion.p
            variants={item}
            className="mt-6 text-sm text-slate-400"
          >
            Trusted by 500+ agencies across SEA · No credit card required
          </motion.p>
        </motion.div>

        {/* Floating product preview card */}
        <FloatingStatsCard />

        {/* Full Animated Product Demo */}
        <LazyAnimatedDemo />
      </div>

      <LazyDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  )
}
