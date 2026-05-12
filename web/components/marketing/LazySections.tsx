"use client"

import dynamic from "next/dynamic"

// Lazy load heavy animated sections
export const LazyAnimatedDemo = dynamic(
  () => import("./AnimatedDemo").then((mod) => mod.AnimatedDemo),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-white/10 bg-slate-900/30 p-8 animate-pulse">
        <div className="h-64 rounded-lg bg-white/5" />
      </div>
    ),
  }
)

export const LazyDemoModal = dynamic(
  () => import("./DemoModal").then((mod) => mod.DemoModal),
  {
    ssr: false,
  }
)
