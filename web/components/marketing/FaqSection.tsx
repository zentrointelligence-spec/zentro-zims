"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. The Starter plan is free forever with no credit card required. You can upgrade to Growth or Pro at any time.",
  },
  {
    q: "Can I import my existing data?",
    a: "Yes. Zentro supports Excel (.xlsx) import for customers and policies. Most agencies are fully imported within 10 minutes.",
  },
  {
    q: "Is my data secure?",
    a: "Each agency's data is fully isolated. No other agency can access your leads, customers, or policies. Data is encrypted in transit and at rest.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts. You can cancel your subscription at any time from the billing settings.",
  },
  {
    q: "Do you support WhatsApp?",
    a: "Yes. Zentro integrates with WhatsApp Business via Twilio. You can send and receive messages directly inside the platform.",
  },
  {
    q: "What regions do you support?",
    a: "Zentro works for any insurance agency globally. We are particularly popular with agencies in Malaysia, Singapore, and Indonesia.",
  },
] as const;

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-b border-white/5 bg-transparent px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/5 border-y border-white/5 bg-slate-900/30 backdrop-blur-sm">
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.q} className="border-b border-white/5 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-6 sm:py-5"
                  aria-expanded={open}
                >
                  <span className="text-base font-semibold text-white">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="px-4 pb-4 text-sm leading-relaxed text-slate-300 sm:px-6 sm:pb-5 sm:text-base">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
