import Link from "next/link";
import { ZentroLogo } from "@/components/zims/logo";

const PRODUCT = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
] as const;

const COMPANY = [
  { href: "/#how-it-works", label: "About", external: false },
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
              <a
                href="https://twitter.com/zentroio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white text-xs font-bold"
                aria-label="Zentro on X (Twitter)"
              >
                𝕏
              </a>
              <a
                href="https://linkedin.com/company/zentroio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white text-xs font-bold"
                aria-label="Zentro on LinkedIn"
              >
                in
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Company
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {COMPANY.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Legal
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm">© 2026 Zentro Intelligence. All rights reserved.</p>
          <p className="text-xs text-slate-600">Built for insurance agencies in SEA &amp; Middle East</p>
        </div>
      </div>
    </footer>
  );
}
