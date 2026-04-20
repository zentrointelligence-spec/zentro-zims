import Link from "next/link";
import type { ReactNode } from "react";

import { ZentroLogo } from "@/components/zims/logo";
import { ThemeToggle } from "@/components/zims/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-slate-900 p-10 text-white md:flex">
        <Link href="/">
          <ZentroLogo variant="light" />
        </Link>
        <div className="space-y-3">
          <blockquote className="text-lg leading-snug text-slate-200">
            &ldquo;We cut renewal follow-ups from a weekly Excel panic to a
            ten-minute sweep. Our retention went up 18% in the first
            quarter.&rdquo;
          </blockquote>
          <div className="text-sm text-slate-400">
            — Priya M · Owner, Mumbai Insurance Co.
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(at 20% 10%, oklch(0.519 0.25 277 / 0.4), transparent 50%), radial-gradient(at 80% 90%, oklch(0.682 0.181 276 / 0.3), transparent 50%)",
          }}
        />
      </div>
      <div className="relative flex items-center justify-center bg-background p-6 md:p-12">
        <div className="absolute right-4 top-4 md:right-8 md:top-8">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 flex md:hidden">
            <Link href="/">
              <ZentroLogo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
