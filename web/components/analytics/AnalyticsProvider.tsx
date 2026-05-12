"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics } from "./GoogleAnalytics"
import { trackPageView } from "@/lib/analytics"

export function AnalyticsProvider() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
      <GoogleAnalytics />
    </>
  )
}
