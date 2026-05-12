"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "We used to lose 30% of renewals to spreadsheets. With Zentro, we're at 98% retention. The WhatsApp reminders alone paid for the subscription.",
    author: "Sarah Chen",
    role: "Principal Agent, Chen Insurance",
    avatar: "SC",
  },
  {
    quote:
      "I went from juggling 4 apps to just Zentro. My team actually enjoys logging in now — the Kanban board makes pipeline management visual and intuitive.",
    author: "Raj Patel",
    role: "Founder, Patel Broking",
    avatar: "RP",
  },
  {
    quote:
      "The Excel import saved us weeks of data entry. We migrated 2,000 customer records in under an hour. Support team was incredibly responsive.",
    author: "Maria Santos",
    role: "Operations Director, Santos Group",
    avatar: "MS",
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
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Loved by insurance professionals
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Don't take our word for it — here's what agency owners say.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-white/10 bg-slate-900/30 p-8 shadow-sm transition-shadow hover:shadow-md hover:border-white/20 backdrop-blur-sm"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="mt-4 text-sm leading-relaxed text-slate-200">
                "{t.quote}"
              </blockquote>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
