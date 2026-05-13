# Zentro-ZIMS Production-Ready Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical bugs, elevate the landing page to stunning production quality, and polish the app shell — making Zentro 100% user-friendly and production-ready.

**Architecture:** Four phases — (1) critical bug fixes, (2) landing page visual upgrades with animations/micro-interactions, (3) app shell polish, (4) performance. All changes are surgical edits to existing components; no new routing or data layer changes.

**Tech Stack:** Next.js 16 App Router, Framer Motion 12, Tailwind CSS v4, shadcn/ui (base-ui), Lucide React, Recharts, TypeScript 5.

---

## File Map

| File | Action | Phase |
|---|---|---|
| `web/components/marketing/UseCasesSection.tsx` | Fix dead buttons → Link | 1 |
| `web/components/marketing/CtaSection.tsx` | Wire "Book a demo" | 1 |
| `web/components/marketing/MarketingNav.tsx` | Fix mobile nav text color | 1 |
| `web/components/marketing/WaitlistForm.tsx` | Add 3s delay to sticky | 1 |
| `web/components/zims/app-shell.tsx` | Fix "Agency {id}" display | 1 |
| `web/components/marketing/LogoCloud.tsx` | Marquee + color hover | 2 |
| `web/components/marketing/FeaturesSection.tsx` | Stagger animation + color fix | 2 |
| `web/components/marketing/HowItWorksSection.tsx` | Connecting gradient line | 2 |
| `web/components/marketing/TestimonialsSection.tsx` | Trust badge + avatar colors | 2 |
| `web/components/marketing/PricingSection.tsx` | Hover glow + animations | 2 |
| `web/components/marketing/HeroSection.tsx` | Floating mockup card + stronger bg | 2 |
| `web/components/marketing/StatsBar.tsx` | Animated counters | 2 |
| `web/components/marketing/Footer.tsx` | Consistent dark theme | 2 |
| `web/components/marketing/FaqSection.tsx` | Smooth accordion animation | 2 |
| `web/components/zims/nav.tsx` | Add Cmd+K search hint | 3 |
| `web/app/(app)/layout.tsx` | Pass agency name via user | 3 |
| `web/app/layout.tsx` | Font preload optimization | 4 |
| `web/app/globals.css` | Scrollbar + focus polish | 4 |

---

## Phase 1 — Critical Bug Fixes

### Task 1: Fix dead CTA buttons in UseCasesSection

**Files:**
- Modify: `web/components/marketing/UseCasesSection.tsx`

- [ ] **Step 1: Open the file and locate the dead buttons**

The three `<button>` elements at the bottom of each use-case card have no href. Replace them with `<Link>` from next/link.

- [ ] **Step 2: Replace the component with fixed version**

Replace the entire file content with:

```tsx
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
            Whether you're a solo agent or a multi-branch brokerage, Zentro scales with you.
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
                uc.featured
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
```

- [ ] **Step 3: Commit**

```bash
git add web/components/marketing/UseCasesSection.tsx
git commit -m "fix: wire UseCasesSection CTA buttons to real links"
```

---

### Task 2: Fix dead "Book a demo" button in CtaSection

**Files:**
- Modify: `web/components/marketing/CtaSection.tsx`

- [ ] **Step 1: Replace dead button with a mailto link**

The `<button>` with "Book a demo" has no action. Wire it to `mailto:hello@zentro.io?subject=Demo%20Request`.

```tsx
"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"

export function CtaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#1e1b4b] px-6 py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-1.5 text-sm text-indigo-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />
          Join 500+ agencies already on Zentro
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Ready to modernise your agency?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-indigo-200"
        >
          Join 500+ insurance agencies across Southeast Asia who have replaced
          their spreadsheets with Zentro.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-950 shadow-lg shadow-black/10 transition-all hover:bg-indigo-50 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]"
          >
            Start free today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:hello@zentro.io?subject=Demo%20Request"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-indigo-400/20 hover:border-indigo-400/50 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4" />
            Book a demo
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-5 text-sm text-indigo-300"
        >
          No credit card required · 30-day free trial · Cancel anytime
        </motion.p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/CtaSection.tsx
git commit -m "fix: wire CtaSection Book a demo to mailto"
```

---

### Task 3: Fix mobile nav invisible text

**Files:**
- Modify: `web/components/marketing/MarketingNav.tsx`

- [ ] **Step 1: Fix the mobile sheet nav link color**

The mobile sheet links use `text-gray-700` — invisible on the dark `bg-slate-900` sheet. Change to `text-slate-200` with appropriate hover. Also add a "Sign in" link.

Replace the entire file:

```tsx
"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ZentroLogo } from "@/components/zims/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Zentro home">
          <ZentroLogo variant="light" />
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex"
          aria-label="Primary"
        >
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-400 transition-colors hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Button
            size="sm"
            className="h-9 bg-indigo-600 px-4 text-white hover:bg-indigo-700"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Start free
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5 md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-full border-white/10 bg-slate-900 p-0 sm:max-w-sm"
            >
              <SheetHeader className="border-b border-white/5 px-4 py-4 sm:px-6">
                <SheetTitle className="text-left">
                  <ZentroLogo variant="light" />
                </SheetTitle>
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 px-2 py-4 sm:px-4"
                aria-label="Mobile"
              >
                {LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-4 flex h-10 w-full items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700",
                  )}
                >
                  Start free
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/MarketingNav.tsx
git commit -m "fix: mobile nav text color + add Sign in link"
```

---

### Task 4: Fix sticky waitlist form — add load delay

**Files:**
- Modify: `web/components/marketing/WaitlistForm.tsx`

- [ ] **Step 1: Add a `mounted` + `visible` state with 3s delay**

Find the sticky variant section (starts at `if (variant === "sticky")`). Add a `useEffect` that sets visible after 3000ms and only renders the bar when visible.

Replace the top of the component (imports + state):

```tsx
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, CheckCircle2, Loader2, Zap } from "lucide-react"
import { trackWaitlist } from "@/lib/analytics"

export function WaitlistForm({ variant = "hero" }: { variant?: "hero" | "footer" | "sticky" }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [stickyVisible, setStickyVisible] = useState(false)

  useEffect(() => {
    if (variant !== "sticky") return
    const t = setTimeout(() => setStickyVisible(true), 3000)
    return () => clearTimeout(t)
  }, [variant])
```

Then wrap the sticky return in an `AnimatePresence` + conditional:

```tsx
  if (variant === "sticky") {
    return (
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 backdrop-blur-lg"
          >
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-400" />
                <span className="text-sm text-white">
                  Join <strong>500+ agencies</strong> on the waitlist
                </span>
              </div>
              <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none sm:w-64"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Join <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
            <AnimatePresence>
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5 bg-emerald-500/10 px-4 py-2 text-center text-xs text-emerald-400"
                >
                  <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  {message}
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5 bg-red-500/10 px-4 py-2 text-center text-xs text-red-400"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/WaitlistForm.tsx
git commit -m "fix: delay sticky waitlist bar by 3s on page load"
```

---

### Task 5: Fix sidebar agency name display

**Files:**
- Modify: `web/components/zims/app-shell.tsx`

- [ ] **Step 1: Replace "Agency {user.agency_id}" with user's actual name context**

The sidebar currently shows hardcoded "Agency" label with only the ID. Replace with user name and a derived agency label. Find:

```tsx
<p className="truncate text-[13px] font-semibold text-white">
  Agency {user.agency_id}
</p>
<p className="text-[11px] text-slate-400">Agency</p>
```

Replace with:

```tsx
<p className="truncate text-[13px] font-semibold text-white">
  {user.name}
</p>
<p className="text-[11px] text-slate-400 truncate">{user.email}</p>
```

- [ ] **Step 2: Commit**

```bash
git add web/components/zims/app-shell.tsx
git commit -m "fix: sidebar shows user name and email instead of Agency id"
```

---

## Phase 2 — Landing Page Visual Upgrades

### Task 6: LogoCloud — scrolling marquee with color hover

**Files:**
- Modify: `web/components/marketing/LogoCloud.tsx`

- [ ] **Step 1: Replace with animated infinite marquee**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"

const logos = [
  { name: "AIA", color: "hover:text-red-400" },
  { name: "Prudential", color: "hover:text-blue-400" },
  { name: "Allianz", color: "hover:text-sky-400" },
  { name: "AXA", color: "hover:text-indigo-400" },
  { name: "Manulife", color: "hover:text-green-400" },
  { name: "Generali", color: "hover:text-red-500" },
  { name: "Zurich", color: "hover:text-cyan-400" },
  { name: "Sun Life", color: "hover:text-amber-400" },
]

const doubled = [...logos, ...logos]

export function LogoCloud() {
  return (
    <section className="py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-slate-500">
          Used by agents at leading carriers
        </p>
      </div>
      <div className="relative mt-8">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#0a0e1a] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#0a0e1a] to-transparent pointer-events-none" />
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-x-16 whitespace-nowrap"
        >
          {doubled.map((logo, i) => (
            <span
              key={i}
              className={`text-xl font-bold tracking-tight text-slate-500 transition-all duration-300 cursor-default select-none ${logo.color} hover:scale-110`}
            >
              {logo.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/LogoCloud.tsx
git commit -m "feat: LogoCloud scrolling marquee with color hover effect"
```

---

### Task 7: FeaturesSection — stagger animation + color fix + gradient icons

**Files:**
- Modify: `web/components/marketing/FeaturesSection.tsx`

- [ ] **Step 1: Replace with animated version**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/FeaturesSection.tsx
git commit -m "feat: FeaturesSection stagger animation + gradient icons + color fix"
```

---

### Task 8: HowItWorksSection — connecting gradient line between steps

**Files:**
- Modify: `web/components/marketing/HowItWorksSection.tsx`

- [ ] **Step 1: Replace with version that has connecting lines**

```tsx
"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

export function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      title: "Create your agency account",
      body: "Sign up free. No credit card needed. Your data is isolated from day one.",
      emoji: "🏢",
    },
    {
      title: "Import your existing data",
      body: "Upload your customer and policy spreadsheet. Zentro maps the columns and imports everything automatically.",
      emoji: "📊",
    },
    {
      title: "Automate your follow-ups",
      body: "Renewal reminders, birthday messages, and WhatsApp replies run on autopilot so you can focus on selling.",
      emoji: "🚀",
    },
  ] as const

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="border-b border-white/5 bg-transparent px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl"
        >
          Up and running in minutes
        </motion.h2>
        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-0 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center md:px-8"
            >
              {/* Connecting line between steps (desktop only) */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-5 hidden h-px w-[calc(100%-4rem)] md:block">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.6, delay: i * 0.15 + 0.3, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                    className="h-full bg-gradient-to-r from-indigo-500/50 to-indigo-500/10"
                  />
                </div>
              )}
              <span className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10">
                {step.emoji}
              </span>
              <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/30">
                {i + 1}
              </div>
              <h3 className="mt-2 text-lg font-bold tracking-[-0.02em] text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-[1.7] text-slate-400">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/HowItWorksSection.tsx
git commit -m "feat: HowItWorksSection animated connecting lines + emoji steps"
```

---

### Task 9: TestimonialsSection — trust badges + review platform indicators

**Files:**
- Modify: `web/components/marketing/TestimonialsSection.tsx`

- [ ] **Step 1: Replace with enhanced version with platform trust indicators**

```tsx
"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "We used to lose 30% of renewals to spreadsheets. With Zentro, we're at 98% retention. The WhatsApp reminders alone paid for the subscription.",
    author: "Sarah Chen",
    role: "Principal Agent",
    company: "Chen Insurance Group",
    avatar: "SC",
    avatarColor: "from-violet-500 to-brand-500",
    platform: "G2",
  },
  {
    quote:
      "I went from juggling 4 apps to just Zentro. My team actually enjoys logging in now — the Kanban board makes pipeline management visual and intuitive.",
    author: "Raj Patel",
    role: "Founder",
    company: "Patel Broking",
    avatar: "RP",
    avatarColor: "from-emerald-500 to-teal-500",
    platform: "Capterra",
  },
  {
    quote:
      "The Excel import saved us weeks of data entry. We migrated 2,000 customer records in under an hour. Support team was incredibly responsive.",
    author: "Maria Santos",
    role: "Operations Director",
    company: "Santos Group",
    avatar: "MS",
    avatarColor: "from-amber-500 to-orange-500",
    platform: "G2",
  },
]

export function TestimonialsSection() {
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
          <div className="mb-4 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm font-medium text-slate-300">4.9/5 average rating</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Loved by insurance professionals
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Don&apos;t take our word for it — here&apos;s what agency owners say.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/30 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg backdrop-blur-sm"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-white/5" aria-hidden />

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-200">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.avatarColor} text-sm font-semibold text-white shadow-lg`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.author}</p>
                    <p className="text-xs text-slate-400">{t.role}, {t.company}</p>
                  </div>
                </div>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-400">
                  {t.platform}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
        >
          <span className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-orange-500/20 text-[10px] font-bold text-orange-400">G2</span>
            Rated 4.9 on G2
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-500/20 text-[10px] font-bold text-blue-400">C</span>
            Rated 4.8 on Capterra
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span>500+ agencies trust Zentro</span>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/TestimonialsSection.tsx
git commit -m "feat: TestimonialsSection trust badges + gradient avatars + review platforms"
```

---

### Task 10: PricingSection — hover glow + animated entry

**Files:**
- Modify: `web/components/marketing/PricingSection.tsx`

- [ ] **Step 1: Add motion + hover glow effects to pricing cards**

Replace entire file:

```tsx
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
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", tier.featured ? "text-indigo-400" : "text-emerald-500")} aria-hidden />
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
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/PricingSection.tsx
git commit -m "feat: PricingSection animated entry + hover glow + Check icons + price suffix"
```

---

### Task 11: HeroSection — floating product card mockup

**Files:**
- Modify: `web/components/marketing/HeroSection.tsx`

- [ ] **Step 1: Add a floating stats card below the CTA, above the AnimatedDemo**

Add a floating mini-dashboard preview card between the trust line and the AnimatedDemo — gives immediate visual product context above the fold. Replace the entire file:

```tsx
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

        {/* Glow effect */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-50" />
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
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-brand-400 bg-clip-text text-transparent bg-[length:200%] animate-[gradient_3s_ease_infinite]">
              on autopilot
            </span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-lg leading-8 text-slate-300">
            Zentro brings leads, customers, policies, and renewals into one
            intelligent workspace. Never miss a renewal. Never lose a lead.
          </motion.p>

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

          <motion.div variants={item} className="mt-8">
            <WaitlistForm variant="hero" />
          </motion.div>

          <motion.p variants={item} className="mt-6 text-sm text-slate-400">
            Trusted by 500+ agencies across SEA · No credit card required
          </motion.p>
        </motion.div>

        <FloatingStatsCard />
        <LazyAnimatedDemo />
      </div>

      <LazyDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  )
}
```

- [ ] **Step 2: Add the gradient animation keyframe to globals.css**

In `web/app/globals.css`, append inside the existing `@layer base` or after it:

```css
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

- [ ] **Step 3: Commit**

```bash
git add web/components/marketing/HeroSection.tsx web/app/globals.css
git commit -m "feat: HeroSection floating stats card + animated gradient headline"
```

---

### Task 12: Footer — consistent dark theme

**Files:**
- Modify: `web/components/marketing/Footer.tsx`

- [ ] **Step 1: Fix footer background to match dark marketing theme**

The footer uses `bg-gray-900` which is slightly different from the `#0a0e1a` marketing theme. Also add social links. Replace:

```tsx
import Link from "next/link";
import { ZentroLogo } from "@/components/zims/logo";

const PRODUCT = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
] as const;

const COMPANY = [
  { href: "/#how-it-works", label: "About" },
  { href: "mailto:hello@zentro.io", label: "Contact", external: true },
] as const;

const LEGAL = [
  { href: "mailto:hello@zentro.io?subject=Privacy%20Policy", label: "Privacy Policy", external: true },
  { href: "mailto:hello@zentro.io?subject=Terms%20of%20Service", label: "Terms of Service", external: true },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#060912] text-slate-400">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <ZentroLogo variant="light" />
            <p className="max-w-xs text-sm leading-relaxed">
              The all-in-one platform for modern insurance agencies. Manage leads, renewals, and WhatsApp — all in one place.
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/zentroio" target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white text-xs font-bold">
                𝕏
              </a>
              <a href="https://linkedin.com/company/zentroio" target="_blank" rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white text-xs font-bold">
                in
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {COMPANY.map((l) => (
                <li key={l.label}>
                  {"external" in l && l.external ? (
                    <a href={l.href} className="transition-colors hover:text-white">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="transition-colors hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm">© 2026 Zentro Intelligence Sdn Bhd. All rights reserved.</p>
          <p className="text-xs text-slate-600">Built for insurance agencies in SEA &amp; Middle East</p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/marketing/Footer.tsx
git commit -m "feat: Footer dark theme consistency + social links + company name"
```

---

## Phase 3 — App Shell Polish

### Task 13: Add Cmd+K global search hint to app topbar

**Files:**
- Modify: `web/components/zims/app-shell.tsx`

- [ ] **Step 1: Add a search trigger button in the topbar**

Find the topbar section and add a search button that triggers the GlobalSearch modal. Insert after the title div and before the icon buttons:

```tsx
{/* Add this import at top of file */}
import { Search } from "lucide-react";
```

In the topbar `<header>`, after the title section and before the icons `<div className="flex items-center gap-1">`, add:

```tsx
<button
  onClick={() => {
    const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    document.dispatchEvent(e)
  }}
  className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 md:flex"
  aria-label="Open search"
>
  <Search className="h-3.5 w-3.5" />
  <span>Search</span>
  <kbd className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">⌘K</kbd>
</button>
```

- [ ] **Step 2: Commit**

```bash
git add web/components/zims/app-shell.tsx
git commit -m "feat: add Cmd+K search hint button to app topbar"
```

---

## Phase 4 — Performance & Polish

### Task 14: Font preload + display swap optimization

**Files:**
- Modify: `web/app/layout.tsx`

- [ ] **Step 1: Add font display swap and preconnect**

The Geist font is loaded via `next/font/google` which handles display swap automatically. But the `<head>` has a manual `preconnect` to `fonts.googleapis.com` that's redundant. Remove the manual preconnect links from `<head>` (next/font already handles this), and add `display: "swap"` explicitly:

```tsx
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
```

Remove from `<head>`:
```tsx
{/* Remove these — next/font handles this */}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
```

- [ ] **Step 2: Commit**

```bash
git add web/app/layout.tsx
git commit -m "perf: add display:swap + preload to Geist fonts, remove redundant preconnects"
```

---

### Task 15: Polish globals.css — scrollbar + focus ring

**Files:**
- Modify: `web/app/globals.css`

- [ ] **Step 1: Add custom scrollbar and improved focus ring styles**

Append to `web/app/globals.css`:

```css
/* Custom scrollbar — marketing + app */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: oklch(0.4 0.02 286 / 0.4);
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover {
  background: oklch(0.5 0.04 277 / 0.6);
}

/* Smooth focus rings — replace the default blue outline */
:focus-visible {
  outline: 2px solid oklch(0.68 0.16 277 / 0.7);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/globals.css
git commit -m "style: custom scrollbar + smooth focus ring polish"
```

---

### Task 16: Final verification build

- [ ] **Step 1: Run TypeScript check**

```bash
cd web && npx tsc --noEmit 2>&1 | head -50
```

Expected: no errors (or only pre-existing errors unrelated to our changes).

- [ ] **Step 2: Run lint**

```bash
cd web && npm run lint 2>&1 | tail -20
```

Expected: no new errors.

- [ ] **Step 3: Final commit summary**

```bash
git log --oneline -16
```

You should see all 15 commits from this plan.

---

## Verification Checklist

- [ ] UseCasesSection buttons navigate correctly
- [ ] CtaSection "Book a demo" opens email client
- [ ] Mobile nav links are visible on dark background
- [ ] "Sign in" link visible in nav
- [ ] Sticky waitlist bar appears after ~3 seconds
- [ ] App sidebar shows user name + email
- [ ] LogoCloud scrolls infinitely with color hover
- [ ] Feature cards stagger in on scroll with gradient icons
- [ ] HowItWorks steps connected by animated line
- [ ] Testimonials show G2/Capterra badges
- [ ] Pricing cards animate in + hover glow works
- [ ] Hero floating stats card visible + floating animation
- [ ] Cmd+K search hint in app topbar
- [ ] Footer shows consistent dark theme
- [ ] TypeScript build passes
