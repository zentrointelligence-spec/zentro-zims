"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlanChip } from "./plan-chip";
import { SidebarNav } from "./nav";
import type { PlanTier } from "@/lib/schemas";
import { ZentroLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  agency_id: number;
};

export function AppShell({
  user,
  billingPlan,
  children,
}: {
  user: SessionUser;
  billingPlan: PlanTier | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-app">
      {/* -- desktop sidebar -- */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-sidebar text-slate-200 md:flex">
        <div className="border-b border-slate-800 px-4 py-4">
          <Link href="/dashboard" className="mb-3 inline-flex">
            <ZentroLogo variant="sidebar" />
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/70 p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white">
              {initials || "AG"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                Agency {user.agency_id}
              </p>
              <p className="text-[11px] text-slate-400">Agency</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </div>
        <div className="border-t border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-100">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-100">
                {user.name}
              </p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {user.role}
            </span>
            {billingPlan ? <PlanChip plan={billingPlan} /> : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* -- topbar -- */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 text-slate-900 sm:px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-700 hover:bg-slate-100 md:hidden"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-slate-800 bg-sidebar p-0 text-slate-200"
              >
                <SheetHeader className="border-b border-slate-800 px-5 py-4">
                  <SheetTitle className="text-left">
                    <ZentroLogo variant="sidebar" />
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <SidebarNav onNavigate={() => setOpen(false)} />
                </div>
                <div className="border-t border-slate-800 px-4 py-3 text-slate-200">
                  <p className="truncate text-xs font-medium">{user.name}</p>
                  <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                  {billingPlan ? <PlanChip plan={billingPlan} /> : null}
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <Link href="/dashboard" className="shrink-0">
                <ZentroLogo variant="sidebar" />
              </Link>
              <span className="truncate text-sm font-semibold tracking-tight text-slate-900">
                Zentro ZIMS
              </span>
            </div>
            <div className="hidden items-center md:flex">
              <h1 className="text-base font-semibold tracking-tight text-slate-900">
                Zentro ZIMS
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
