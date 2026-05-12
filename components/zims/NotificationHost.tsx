"use client";

import { NotificationCenter } from "@/components/zims/NotificationCenter";

/**
 * Fixed header-aligned notification bell so we do not need to edit
 * `app-shell.tsx`. Mirrors `GlobalSearchHost`: sits in the top bar band
 * (z-40, below global search z-50 when open).
 */
export function NotificationHost() {
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-40 h-14 w-full md:left-60 md:w-[calc(100%-15rem)]">
      <div className="flex h-full items-center justify-end gap-1 px-3 sm:px-4 md:px-6">
        <div className="pointer-events-auto">
          <NotificationCenter />
        </div>
        <div className="pointer-events-none size-9 shrink-0" aria-hidden />
        <div
          className="pointer-events-none hidden h-9 min-w-[10rem] shrink-0 md:block lg:min-w-[12rem]"
          aria-hidden
        />
      </div>
    </div>
  );
}
