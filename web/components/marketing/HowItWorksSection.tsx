"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

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
                <div className="absolute left-[calc(50%+2.5rem)] top-6 hidden h-px w-[calc(100%-5rem)] md:block">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.6, delay: i * 0.15 + 0.35, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                    className="h-full bg-gradient-to-r from-indigo-500/60 to-indigo-500/10"
                  />
                </div>
              )}
              <span className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl shadow-lg shadow-indigo-500/25 ring-4 ring-[#0a0e1a]">
                {step.emoji}
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/30">
                {i + 1}
              </div>
              <h3 className="mt-3 text-lg font-bold tracking-[-0.02em] text-white">
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
