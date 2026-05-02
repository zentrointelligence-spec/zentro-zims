# Phase 3 — Public marketing site (Next.js)

**Status:** Shipped (initial marketing surface).  
**Code:** `web/app/(marketing)/`, `web/components/marketing/`, `web/lib/blog-posts.ts`.

---

## 1. Goals delivered

- **Public routes** (no `lib/api.ts`, no auth, not gated by `proxy.ts` for these paths):
  - `/` — landing: hero, features, how-it-works, pricing preview, CTA
  - `/pricing` — full three-tier pricing, FAQ accordion, CTA
  - `/blog` — index of static posts
  - `/blog/[slug]` — three articles; `generateStaticParams` for SSG
- **SEO:** each route exports `metadata` (title, description) plus **Open Graph** fields.
- **Layout:** `MarketingNav` (desktop + mobile sheet) + `Footer`; max content width **1200px**; no app sidebar; **no theme toggle** on marketing shell (per product spec).
- **Interactivity:** `"use client"` only where needed (`MarketingNav`, `FaqSection`); all `page.tsx` files remain **Server Components** with `export const dynamic = "force-static"` where applicable.
- **Conventions:** `render={<…/>}` on Base UI triggers (no `asChild`); Zod **not** inlined in marketing folders (blog copy lives in `lib/blog-posts.ts`).

---

## 2. Build output (expectations)

- `/`, `/pricing`, `/blog` prerender as **static (○)**.
- `/blog/[slug]` prerender as **SSG (●)** with static HTML per slug.

---

## 3. Changelog (subset)

| Date | Note |
|------|------|
| 2026-04-21 | Initial Phase 3 marketing: nav, footer, sections, pricing page, blog + `lib/blog-posts.ts`; indigo/gray marketing palette. |

---

**Related:** All phases shipped so far (narrative): [`PHASES-SHIPPED-SUMMARY.md`](./PHASES-SHIPPED-SUMMARY.md). Authenticated app UX polish: [`WEB-APP-UI-POLISH.md`](./WEB-APP-UI-POLISH.md) (not marketing).

---

*Update this file when marketing routes, copy, or SEO strategy change.*
