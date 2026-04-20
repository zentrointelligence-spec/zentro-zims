"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname.startsWith("/register");

  return (
    <div className="min-h-screen md:flex">
      <aside className="relative hidden w-[45%] overflow-hidden bg-[#0f172a] md:flex">
        <div
          className="absolute inset-0 z-0 opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />
        <div
          className="absolute -left-20 -top-20 z-0 h-[500px] w-[500px] rounded-full opacity-70 blur-3xl animate-[pulse_4s_ease-in-out_infinite_alternate]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -right-20 z-0 h-[400px] w-[400px] rounded-full opacity-60 blur-3xl animate-[pulse_4s_ease-in-out_infinite_alternate]"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10">
          <div className="flex items-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-400 to-indigo-600 text-sm font-bold text-white">
                Z
              </span>
              <span className="text-base font-bold text-white">Zentro</span>
              <span className="ml-1 rounded-full bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                ZIMS
              </span>
            </Link>
          </div>

          <div className="max-w-md">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />
              AI-powered platform
            </div>
            <h2 className="text-4xl leading-[1.1] font-extrabold tracking-[-0.03em] text-white">
              The{" "}
              <span className="bg-linear-to-br from-indigo-300 to-violet-400 bg-clip-text text-transparent">
                smartest
              </span>{" "}
              way to run your{" "}
              <span className="bg-linear-to-br from-indigo-300 to-violet-400 bg-clip-text text-transparent">
                insurance agency
              </span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              Manage leads, automate renewals, and close more deals on WhatsApp
              — all in one place.
            </p>
          </div>

          <div className="grid max-w-md grid-cols-2 gap-3">
            {[
              { value: "10x", label: "Faster follow-ups" },
              { value: "0", label: "Missed renewals" },
              { value: "5 min", label: "To import your data" },
              { value: "Free", label: "To get started" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-[22px] leading-none font-extrabold text-indigo-300">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>

          {isRegister ? (
            <div className="max-w-md">
              <p className="mb-3 text-sm text-slate-300">
                Join 500+ insurance agencies
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Free forever on Starter",
                  "Import data in 5 minutes",
                  "No credit card required",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1.5 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-md space-y-3">
              {[
                {
                  initials: "AH",
                  avatar: "bg-indigo-500/20 text-indigo-200",
                  quote: "Cut our renewal rate to zero",
                  agency: "Ahmad Insurance",
                },
                {
                  initials: "ML",
                  avatar: "bg-teal-500/20 text-teal-200",
                  quote: "Saved 10hrs/week on follow-ups",
                  agency: "ML Agency",
                },
                {
                  initials: "RS",
                  avatar: "bg-violet-500/20 text-violet-200",
                  quote: "Best CRM we've used for insurance",
                  agency: "RS Brokers",
                },
              ].map((item) => (
                <div key={item.initials} className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${item.avatar}`}
                  >
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm text-slate-300">&ldquo;{item.quote}&rdquo;</p>
                    <p className="text-xs text-slate-500">{item.agency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 md:w-[55%] md:px-10 md:py-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
