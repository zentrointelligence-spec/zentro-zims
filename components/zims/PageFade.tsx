"use client";

import type { ReactNode } from "react";

/**
 * Subtle fade-in for client data shells after server render.
 * Animation defined in `app/globals.css` (`.zims-page-fade`).
 */
export function PageFade({ children }: { children: ReactNode }) {
  return <div className="zims-page-fade">{children}</div>;
}
