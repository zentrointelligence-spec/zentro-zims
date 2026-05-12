import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    priceLabel: "$79 / month",
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
    priceLabel: "$199 / month",
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
    href: "mailto:hello@zentro.io",
    external: true,
  },
] as const;

export function PricingSection({ id = "pricing" }: { id?: string }) {
  return (
    <section
      id={id}
      className="border-b border-white/5 bg-transparent px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-slate-400">
            Start free. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/30 p-8 shadow-sm backdrop-blur-sm",
                tier.featured
                  ? "scale-100 border-2 border-indigo-600 lg:z-10 lg:scale-105"
                  : "border-white/10",
              )}
            >
              {tier.featured ? (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </p>
              ) : null}
              <h3 className="text-xl font-bold tracking-[-0.02em] text-white">
                {tier.name}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{tier.tagline}</p>
              <p className="mt-6 text-3xl font-bold tracking-tight text-white">
                {tier.priceLabel}
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm leading-relaxed text-slate-300">
                {tier.features.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-0.5 text-indigo-600" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {tier.external ? (
                  <Button
                    variant="outline"
                    className="h-9 w-full border-gray-300 text-white hover:bg-gray-50"
                    nativeButton={false}
                    render={<a href={tier.href} />}
                  >
                    {tier.cta}
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "h-9 w-full text-white",
                      tier.featured
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-indigo-600 hover:bg-indigo-700",
                    )}
                    nativeButton={false}
                    render={<Link href={tier.href} />}
                  >
                    {tier.cta}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
