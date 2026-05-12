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
