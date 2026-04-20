"use client";

import {
  CheckSquare,
  FileText,
  Search,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { format, parseISO } from "date-fns";

import { searchAll, type SearchAllResult } from "@/lib/search-client";
import { StatusChip } from "@/components/zims/status-chip";
import { SkeletonRow } from "@/components/zims/Skeleton";
import { cn } from "@/lib/utils";

type FlatRow =
  | { key: string; kind: "lead"; href: string; lead: SearchAllResult["leads"][0] }
  | {
      key: string;
      kind: "customer";
      href: string;
      customer: SearchAllResult["customers"][0];
    }
  | { key: string; kind: "policy"; href: string; policy: SearchAllResult["policies"][0] }
  | { key: string; kind: "task"; href: string; task: SearchAllResult["tasks"][0] };

type FlatBundle = {
  rows: FlatRow[];
  leadIdx: Map<string, number>;
  customerIdx: Map<string, number>;
  policyIdx: Map<string, number>;
  taskIdx: Map<string, number>;
};

function emptyFlatBundle(): FlatBundle {
  return {
    rows: [],
    leadIdx: new Map(),
    customerIdx: new Map(),
    policyIdx: new Map(),
    taskIdx: new Map(),
  };
}

function buildFlatBundle(data: SearchAllResult): FlatBundle {
  const rows: FlatRow[] = [];
  const leadIdx = new Map<string, number>();
  const customerIdx = new Map<string, number>();
  const policyIdx = new Map<string, number>();
  const taskIdx = new Map<string, number>();
  let i = 0;
  for (const lead of data.leads) {
    leadIdx.set(lead.id, i);
    rows.push({
      key: `lead-${lead.id}`,
      kind: "lead",
      href: "/leads",
      lead,
    });
    i += 1;
  }
  for (const customer of data.customers) {
    customerIdx.set(customer.id, i);
    rows.push({
      key: `customer-${customer.id}`,
      kind: "customer",
      href: `/customers/${customer.id}`,
      customer,
    });
    i += 1;
  }
  for (const policy of data.policies) {
    policyIdx.set(policy.id, i);
    rows.push({
      key: `policy-${policy.id}`,
      kind: "policy",
      href: "/policies",
      policy,
    });
    i += 1;
  }
  for (const task of data.tasks) {
    taskIdx.set(task.id, i);
    rows.push({
      key: `task-${task.id}`,
      kind: "task",
      href: "/tasks",
      task,
    });
    i += 1;
  }
  return { rows, leadIdx, customerIdx, policyIdx, taskIdx };
}

function fmtDue(d: string): string {
  try {
    const iso = d.slice(0, 10);
    return format(parseISO(iso), "dd MMM");
  } catch {
    return d.slice(0, 10);
  }
}

const QUICK_LINKS: {
  href: string;
  label: string;
  icon: typeof UserPlus;
}[] = [
  { href: "/leads?create=1", label: "New lead", icon: UserPlus },
  { href: "/customers?create=1", label: "New customer", icon: Users },
  { href: "/policies?create=1", label: "New policy", icon: FileText },
  { href: "/tasks?create=1", label: "New task", icon: CheckSquare },
];

const ROW_CLASS = cn(
  "flex h-[44px] w-full cursor-pointer items-center gap-3 border-b border-l-2 border-l-transparent border-neutral-100 px-4 text-left transition-colors duration-150 ease-out last:border-b-0 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-zinc-900",
);

const SELECTED_ROW_CLASS = cn(
  "border-l-[#4f46e5] bg-[#eef2ff] hover:bg-[#eef2ff] dark:bg-indigo-950/40 dark:hover:bg-indigo-950/40",
);

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchAllResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [panelEnter, setPanelEnter] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      setPanelEnter(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const flatBundle = useMemo(
    () => (data ? buildFlatBundle(data) : emptyFlatBundle()),
    [data],
  );
  const flatRows = flatBundle.rows;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }
      if (flatRows.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "Tab") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatRows.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Enter") {
        const idx = selectedIndex < 0 ? 0 : selectedIndex;
        const row = flatRows[idx];
        if (row) {
          e.preventDefault();
          onOpenChange(false);
          router.push(row.href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, flatRows, selectedIndex, router]);

  useEffect(() => {
    if (!open) return;
    if (debounced.trim().length < 2) {
      queueMicrotask(() => {
        setData(null);
        setLoading(false);
        setSelectedIndex(-1);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setData(null);
    });
    void searchAll(debounced).then((res) => {
      if (cancelled) return;
      setData(res);
      setLoading(false);
      const bundle = buildFlatBundle(res);
      setSelectedIndex(bundle.rows.length ? 0 : -1);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  useEffect(() => {
    if (open) return;
    queueMicrotask(() => {
      setQuery("");
      setDebounced("");
      setData(null);
      setLoading(false);
      setSelectedIndex(-1);
      setPanelEnter(false);
    });
  }, [open]);

  useEffect(() => {
    if (selectedIndex < 0) return;
    const el = document.querySelector(
      `[data-global-search-idx="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, flatRows.length]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const showQuick = query.trim().length < 2;
  const showEmpty =
    !showQuick &&
    !loading &&
    debounced.trim().length >= 2 &&
    flatRows.length === 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close search"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-150 ease-out",
          panelEnter ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "pointer-events-auto fixed top-[15%] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-150 ease-out dark:bg-zinc-950",
          panelEnter ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, customers, policies, tasks..."
            className="min-w-0 flex-1 border-0 bg-transparent text-lg outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-0"
            style={{ fontSize: 18 }}
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="space-y-0 divide-y divide-border px-2 py-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : showQuick ? (
            <div className="px-4 py-3">
              <p className="mb-2 px-1 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                Quick links
              </p>
              <div className="divide-y divide-border rounded-lg border border-border">
                {QUICK_LINKS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={l.href}
                      type="button"
                      className="flex h-11 w-full items-center justify-between px-4 text-left text-sm text-foreground transition-colors duration-150 ease-out hover:bg-gray-50 dark:hover:bg-zinc-900"
                      onClick={() => navigate(l.href)}
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {l.label}
                      </span>
                      <span className="text-muted-foreground">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Search className="h-10 w-10 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                No results for &quot;{debounced.trim()}&quot;
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Try searching by name, phone, or policy number
              </p>
            </div>
          ) : (
            <div className="pb-1">
              {data && data.leads.length ? (
                <div>
                  <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground dark:border-neutral-800 dark:bg-zinc-950">
                    Leads · {data.leads.length} results
                  </div>
                  {data.leads.map((lead) => {
                    const idx = flatBundle.leadIdx.get(lead.id) ?? -1;
                    return (
                      <button
                        key={lead.id}
                        type="button"
                        data-global-search-idx={idx}
                        className={cn(
                          ROW_CLASS,
                          selectedIndex === idx && SELECTED_ROW_CLASS,
                        )}
                        onClick={() => navigate("/leads")}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <User
                          className="h-4 w-4 shrink-0 text-indigo-600"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {lead.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {lead.phone ?? "—"}
                          </div>
                        </div>
                        <StatusChip status={lead.status} kind="lead" />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {data && data.customers.length ? (
                <div>
                  <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground dark:border-neutral-800 dark:bg-zinc-950">
                    Customers · {data.customers.length} results
                  </div>
                  {data.customers.map((customer) => {
                    const idx = flatBundle.customerIdx.get(customer.id) ?? -1;
                    return (
                      <button
                        key={customer.id}
                        type="button"
                        data-global-search-idx={idx}
                        className={cn(
                          ROW_CLASS,
                          selectedIndex === idx && SELECTED_ROW_CLASS,
                        )}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Users
                          className="h-4 w-4 shrink-0 text-teal-600"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {customer.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {customer.email ?? "—"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {data && data.policies.length ? (
                <div>
                  <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground dark:border-neutral-800 dark:bg-zinc-950">
                    Policies · {data.policies.length} results
                  </div>
                  {data.policies.map((policy) => {
                    const idx = flatBundle.policyIdx.get(policy.id) ?? -1;
                    return (
                      <button
                        key={policy.id}
                        type="button"
                        data-global-search-idx={idx}
                        className={cn(
                          ROW_CLASS,
                          selectedIndex === idx && SELECTED_ROW_CLASS,
                        )}
                        onClick={() => navigate("/policies")}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <FileText
                          className="h-4 w-4 shrink-0 text-blue-600"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono text-sm font-semibold">
                            {policy.policy_number}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {policy.policy_type}
                          </div>
                        </div>
                        <StatusChip status={policy.status} kind="policy" />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {data && data.tasks.length ? (
                <div>
                  <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground dark:border-neutral-800 dark:bg-zinc-950">
                    Tasks · {data.tasks.length} results
                  </div>
                  {data.tasks.map((task) => {
                    const idx = flatBundle.taskIdx.get(task.id) ?? -1;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        data-global-search-idx={idx}
                        className={cn(
                          ROW_CLASS,
                          selectedIndex === idx && SELECTED_ROW_CLASS,
                        )}
                        onClick={() => navigate("/tasks")}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <CheckSquare
                          className="h-4 w-4 shrink-0 text-amber-600"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {task.title}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {fmtDue(task.due_date)}
                          </div>
                        </div>
                        <StatusChip status={task.status} kind="task" />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-[#e5e7eb] px-4 py-2 text-center text-[12px] text-muted-foreground dark:border-neutral-800">
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  );
}
