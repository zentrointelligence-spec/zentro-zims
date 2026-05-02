"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bell,
  CheckSquare,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SkeletonRow } from "@/components/zims/Skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, type Notification } from "@/lib/notifications-client";
import { cn } from "@/lib/utils";

const PANEL_GROUPS: { priority: number; label: string }[] = [
  { priority: 1, label: "Urgent" },
  { priority: 2, label: "Overdue" },
  { priority: 3, label: "Renewals" },
  { priority: 4, label: "Messages" },
];

function groupNotifications(items: Notification[]) {
  const map = new Map<number, Notification[]>();
  for (const g of PANEL_GROUPS) map.set(g.priority, []);
  for (const n of items) {
    const bucket = map.get(n.priority);
    if (bucket) bucket.push(n);
  }
  return PANEL_GROUPS.filter((g) => (map.get(g.priority) ?? []).length > 0).map(
    (g) => ({
      ...g,
      items: map.get(g.priority) ?? [],
    }),
  );
}

function rowIcon(n: Notification): {
  Icon: LucideIcon;
  iconBg: string;
  iconFg: string;
} {
  switch (n.type) {
    case "overdue_task":
      return {
        Icon: CheckSquare,
        iconBg: "bg-amber-50",
        iconFg: "text-amber-600",
      };
    case "renewal_due":
      return {
        Icon: RefreshCw,
        iconBg: "bg-brand-50",
        iconFg: "text-brand-600",
      };
    case "policy_expired":
      return {
        Icon: AlertCircle,
        iconBg: "bg-red-50",
        iconFg: "text-red-600",
      };
    case "new_message":
    default:
      return {
        Icon: MessageCircle,
        iconBg: "bg-green-50",
        iconFg: "text-green-600",
      };
  }
}

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [panelEnter, setPanelEnter] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    isLoading,
    unreadCount,
    previousCount,
    markRead,
    markAllRead,
  } = useNotifications(open);

  const closePanel = useCallback(() => {
    setOpen(false);
    setPanelEnter(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      setPanelEnter(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (unreadCount <= previousCount) return undefined;
    let clearPulse: number | undefined;
    const rafId = window.requestAnimationFrame(() => {
      setBadgePulse(true);
      clearPulse = window.setTimeout(() => setBadgePulse(false), 450);
    });
    return () => {
      window.cancelAnimationFrame(rafId);
      if (clearPulse !== undefined) window.clearTimeout(clearPulse);
    };
  }, [unreadCount, previousCount]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = rootRef.current;
      if (!el || !panelRef.current) return;
      const target = e.target as Node;
      if (!el.contains(target)) {
        closePanel();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, closePanel]);

  const groups = useMemo(
    () => groupNotifications(notifications),
    [notifications],
  );

  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : "";

  const handleRowClick = useCallback(
    (n: Notification) => {
      markRead(n.id);
      closePanel();
      router.push(n.link);
    },
    [closePanel, markRead, router],
  );

  const bellActive = open;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            closePanel();
          } else {
            setPanelEnter(false);
            setOpen(true);
          }
        }}
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          bellActive
            ? "bg-brand-50 text-brand-600"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute right-0 top-0 flex min-h-[18px] min-w-[18px] translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full border-2 border-white bg-[#ef4444] px-0.5 text-[10px] font-bold leading-none text-white",
              badgePulse && "animate-zentro-bell-pulse",
            )}
          >
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className={cn(
            "absolute right-0 top-full z-40 mt-2 w-[380px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white shadow-modal transition-[opacity,transform] duration-150 ease-out",
            panelEnter ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          )}
          role="dialog"
          aria-label="Notification list"
        >
          <div className="flex flex-col">
            <div className="sticky top-0 z-10 flex flex-row items-center border-b border-[#f1f5f9] px-4 pb-3 pt-4">
              <div className="flex min-w-0 flex-1 items-center">
                <span className="text-[14px] font-semibold text-slate-900">
                  Notifications
                </span>
                {unreadCount > 0 ? (
                  <span className="ml-2 rounded-full bg-brand-100 px-[7px] py-px text-[11px] font-semibold text-brand-700">
                    {unreadCount}
                  </span>
                ) : null}
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="cursor-pointer text-[12px] font-medium text-slate-400 transition-colors hover:text-slate-700"
                >
                  Mark all read
                </button>
              ) : null}
            </div>

            <div
              className={cn(
                "max-h-[440px] overflow-y-auto",
                "[scrollbar-width:thin]",
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200",
              )}
            >
              {isLoading ? (
                <div className="space-y-2 px-4 py-3">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-10 text-center">
                  <Bell className="h-10 w-10 text-slate-300" aria-hidden />
                  <p className="mt-3 text-[14px] font-medium text-slate-700">
                    You&apos;re all caught up
                  </p>
                  <p className="mt-1 max-w-xs text-[12px] text-slate-400">
                    No overdue tasks or upcoming renewals right now.
                  </p>
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.priority}>
                    <div className="sticky top-0 z-[1] bg-white px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      {g.label}
                    </div>
                    {g.items.map((n) => {
                      const { Icon, iconBg, iconFg } = rowIcon(n);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleRowClick(n)}
                          className={cn(
                            "flex min-h-16 w-full cursor-pointer flex-row gap-3 border-l-[3px] px-4 py-3 text-left transition-colors duration-100",
                            n.read
                              ? "border-transparent bg-[#fafafa]"
                              : "border-brand-500 bg-white",
                            "hover:bg-slate-50",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                              iconBg,
                            )}
                          >
                            <Icon
                              className={cn("h-4 w-4", iconFg)}
                              aria-hidden
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-[13px] font-medium",
                                n.read ? "text-slate-600" : "text-slate-900",
                              )}
                            >
                              {n.title}
                            </p>
                            <p
                              className={cn(
                                "mt-1 line-clamp-2 overflow-hidden text-[12px]",
                                n.read ? "text-slate-400" : "text-slate-500",
                              )}
                            >
                              {n.body}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-4">
                            <span className="text-[11px] text-slate-400">
                              {formatRelativeTime(n.timestamp)}
                            </span>
                            {!n.read ? (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-brand-500"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#f1f5f9] px-4 py-2.5 text-center text-[11px] text-slate-400">
              Refreshes every 60s · Live data
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
