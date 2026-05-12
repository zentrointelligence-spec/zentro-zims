"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@wrksz/themes/client";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-9 shrink-0", className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="size-4 opacity-40" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={cn("size-9 shrink-0", className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-4 transition-transform" />
      ) : (
        <Moon className="size-4 transition-transform" />
      )}
    </Button>
  );
}
