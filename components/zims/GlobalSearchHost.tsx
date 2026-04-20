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
      {/* Fixed trigger aligned with app-shell header (sidebar = md:w-64). */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 h-16 w-full md:left-64 md:w-[calc(100%-16rem)]">
        <div className="flex h-full items-center justify-end pr-14 sm:pr-16 md:justify-start md:px-6 md:pr-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-full border border-sidebar-border/80 bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/60 hover:text-foreground md:px-3",
            )}
            aria-label="Open search"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden md:inline">Search…</span>
            <kbd className="hidden rounded border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:inline">
              {kbdHint}
            </kbd>
          </button>
        </div>
      </div>

      <GlobalSearch open={open} onOpenChange={setOpen} />
    </>
  );
}
