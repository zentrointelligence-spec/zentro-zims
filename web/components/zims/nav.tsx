"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Receipt,
  Settings,
  Sparkles,
  Target,
  Users,
  UsersRound,
  CheckSquare,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/leads", label: "Leads", icon: Target },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/policies", label: "Policies", icon: FileText },
      { href: "/quotes", label: "Quotes", icon: Receipt },
      { href: "/interactions", label: "Interactions", icon: MessageSquare },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
      { href: "/ai-tools", label: "AI Tools", icon: Sparkles },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/analytics", label: "Analytics", icon: BarChart3 }],
  },
  {
    label: "Admin",
    items: [
      { href: "/team", label: "Team", icon: UsersRound },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/billing", label: "Billing", icon: CreditCard },
    ],
  },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-4 px-3 py-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-1 text-[10px] font-medium tracking-[0.14em] text-slate-500 uppercase">
            {section.label}
          </p>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex h-9 items-center gap-2.5 rounded-lg border-l-[3px] border-l-transparent px-3 text-[12px] font-medium transition-colors",
                    active
                      ? "border-l-brand-500 bg-brand-600/20 text-brand-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
