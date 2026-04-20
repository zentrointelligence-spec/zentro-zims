"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Global command-palette open state + Cmd/Ctrl+K shortcut.
 * Keep modal UI in `GlobalSearch`; this hook stays tiny for layout wiring.
 */
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { open, setOpen };
}
