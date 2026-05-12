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
