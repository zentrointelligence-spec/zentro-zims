"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ZentroLogo } from "@/components/zims/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Zentro home">
          <ZentroLogo variant="dark" />
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex"
          aria-label="Primary"
        >
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            size="sm"
            className="h-9 bg-indigo-600 px-4 text-white hover:bg-indigo-700"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Start free
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-gray-200 md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-full border-gray-200 p-0 sm:max-w-sm"
            >
              <SheetHeader className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <SheetTitle className="text-left text-gray-900">Menu</SheetTitle>
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 px-2 py-4 sm:px-4"
                aria-label="Mobile"
              >
                {LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-3 text-base font-medium text-gray-700",
                      "hover:bg-indigo-50 hover:text-indigo-900",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-4 flex h-10 w-full items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700",
                  )}
                >
                  Start free
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
