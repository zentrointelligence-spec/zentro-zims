"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const logos = [
  "AIA",
  "Prudential",
  "Allianz",
  "AXA",
  "Manulife",
  "Generali",
]

export function LogoCloud() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section ref={ref} className="py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-slate-400">
          Trusted by leading agencies
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {logos.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 0.35 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-xl font-bold tracking-tight text-slate-300 transition-opacity hover:opacity-70 hover:text-white"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
