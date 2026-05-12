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
  {
    href: "mailto:hello@zentro.io?subject=Privacy%20Policy",
    label: "Privacy Policy",
    external: true,
  },
  {
    href: "mailto:hello@zentro.io?subject=Terms%20of%20Service",
    label: "Terms of Service",
    external: true,
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <ZentroLogo variant="light" />
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              The all-in-one platform for modern insurance agencies
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Product
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Company
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {COMPANY.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      className="text-gray-300 transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-gray-300 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Legal
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500 sm:text-left">
          © 2026 Zentro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
