"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* -- desktop sidebar -- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link href="/dashboard">
            <ZentroLogo variant="sidebar" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t border-sidebar-border px-4 py-3 text-sidebar-foreground">
          <p className="truncate text-xs font-medium">{user.name}</p>
          <p className="truncate text-[10px] text-sidebar-foreground/60">
            {user.email}
          </p>
          {billingPlan ? <PlanChip plan={billingPlan} /> : null}
        </div>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/55">
          v0.1 · Phase 1
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* -- topbar -- */}
        <header className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar/90 px-3 text-sidebar-foreground backdrop-blur-md sm:px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
              >
                <SheetHeader className="border-b border-sidebar-border px-5 py-4">
                  <SheetTitle className="text-left">
                    <ZentroLogo variant="sidebar" />
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <SidebarNav onNavigate={() => setOpen(false)} />
                </div>
                <div className="border-t border-sidebar-border px-4 py-3 text-sidebar-foreground">
                  <p className="truncate text-xs font-medium">{user.name}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/60">
                    {user.email}
                  </p>
                  {billingPlan ? <PlanChip plan={billingPlan} /> : null}
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <Link href="/dashboard" className="shrink-0">
                <ZentroLogo variant="sidebar" />
              </Link>
              <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                Zentro ZIMS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
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
