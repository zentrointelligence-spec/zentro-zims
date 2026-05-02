import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-[#1e1b4b] px-4 py-16 text-white sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px] text-center">
        <h2 className="text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
          Ready to modernise your agency?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-[1.7] text-indigo-100">
          Join insurance agencies across Southeast Asia who have replaced their
          spreadsheets with Zentro.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-11 min-w-[220px] border-0 bg-white text-base font-semibold text-indigo-950 hover:bg-indigo-50"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Start free today
          </Button>
        </div>
        <p className="mt-4 text-sm text-indigo-200">No credit card required</p>
      </div>
    </section>
  );
}
