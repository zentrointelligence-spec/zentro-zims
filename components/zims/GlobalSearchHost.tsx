"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

import { GlobalSearch } from "@/components/zims/GlobalSearch";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { cn } from "@/lib/utils";

function readKbdHint(): string {
  return /mac|iphone|ipad|ipod/i.test(navigator.platform) ? "⌘K" : "Ctrl+K";
}

/**
 * Renders the global search modal + a fixed header-aligned trigger so we do not
 * need to edit `app-shell.tsx`. The trigger sits in the top bar visual band
 * (below z-50 modal when open).
 */
export function GlobalSearchHost() {
  const { open, setOpen } = useGlobalSearch();
  const kbdHint = useSyncExternalStore(
    () => () => {},
    readKbdHint,
    () => "⌘K",
  );

  return (
    <>
      {/* Fixed trigger centered in app-shell header. */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 h-14 w-full md:left-60 md:w-[calc(100%-15rem)]">
        <div className="flex h-full items-center justify-center px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "pointer-events-auto flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-600",
            )}
            aria-label="Open search"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 sm:inline">
              {kbdHint}
            </kbd>
          </button>
        </div>
      </div>

      <GlobalSearch open={open} onOpenChange={setOpen} />
    </>
  );
}
