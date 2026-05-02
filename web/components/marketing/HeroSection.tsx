import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col justify-center border-b border-gray-200 bg-gray-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-[1200px] w-full">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className={cn(
              "mb-6 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5",
              "text-sm font-medium text-indigo-700",
            )}
          >
            The all-in-one platform for modern insurance agencies
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.02em] text-gray-900 sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
            Stop losing renewals. Start growing your agency.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-[1.7] text-gray-500 sm:text-lg">
            Zentro replaces your spreadsheets, WhatsApp notes, and missed follow-ups
            with one intelligent platform built for insurance agencies.
          </p>
          <p className="mt-3 text-sm font-medium text-gray-600">
            Manage leads, automate renewals, chat on WhatsApp, and close more deals —
            all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="h-11 min-w-[200px] bg-indigo-600 px-8 text-base text-white hover:bg-indigo-700"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              Start free today
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 min-w-[200px] border-gray-300 bg-white text-base text-gray-900 hover:bg-gray-50"
              nativeButton={false}
              render={<a href="#how-it-works" aria-label="Scroll to how it works" />}
            >
              See how it works
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Trusted by insurance agencies across Southeast Asia · No credit card
            required
          </p>
        </div>
      </div>
    </section>
  );
}
