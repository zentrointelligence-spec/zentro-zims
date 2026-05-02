# Web app UI polish (authenticated `(app)/` shell)

**Status:** Shipped (presentation layer only).  
**Scope:** Loading skeletons, empty states, toasts, form error styling, submit spinners, page fade-in, confirm dialogs, keyboard shortcut **`N`** for “new” flows. **No** new features, **no** changes to `web/lib/api.ts`, `web/lib/schemas.ts`, `web/proxy.ts`, Server Actions (except where already present), or backend.

**Primary code:** `web/components/zims/`, `web/hooks/useKeyboardShortcut.ts`, `web/app/(app)/**/loading.tsx`, targeted client components under `web/app/(app)/`.

**Where this sits in the program:** See the phase-by-phase narrative in [`PHASES-SHIPPED-SUMMARY.md`](./PHASES-SHIPPED-SUMMARY.md).

---

## 1. Reusable components & hooks

| Artifact | Path | Role |
|----------|------|------|
| **Skeleton primitives** | `web/components/zims/Skeleton.tsx` | `SkeletonRow`, `SkeletonTable` (default **5** rows; pass `rows={6}` where needed), `SkeletonCard`, `SkeletonKpi`, `SkeletonPageHeader` — Tailwind `animate-pulse` on gray bars |
| **Page fade** | `web/components/zims/PageFade.tsx` | Client wrapper; animation class **`zims-page-fade`** defined in `web/app/globals.css` (`@keyframes zims-page-fade-in`, 200ms ease-out) |
| **Mutation error toasts** | `web/components/zims/app-toast.ts` | `toastMutationError(detail?)` — Sonner **`error`** with title **“Something went wrong”** and API message as **description** |
| **Inline spinner** | `web/components/zims/loading-spinner.tsx` | `InlineSpinner` — 16px `Loader2` for buttons (keep **label text**; do not replace with “Loading…”) |
| **Empty states** | `web/components/zims/empty-state.tsx` | `title`, optional `description`, optional `icon`, optional **`action`** (e.g. `Link` + `buttonVariants()`) |
| **Confirm dialogs** | `web/components/zims/confirm-dialog.tsx` | Shared dialog: **`confirmVariant`**, optional **`confirmClassName`** (e.g. solid indigo for send/accept), cancel = **`secondary`**, buttons **`h-9`** |
| **Keyboard shortcut** | `web/hooks/useKeyboardShortcut.ts` | `useKeyboardShortcut(key, callback, enabled?)` — listens on `window`; ignores **input**, **textarea**, **select**, **contenteditable**, `[role="textbox"]`; ignores modified keys |

---

## 2. Route-level `loading.tsx` (Server Components)

Each file is a **default export**, **no** `"use client"`, and mirrors the page’s rough layout (header/title skeleton + table or KPI grid).

| Route | File |
|-------|------|
| Leads | `web/app/(app)/leads/loading.tsx` |
| Customers | `web/app/(app)/customers/loading.tsx` |
| Policies | `web/app/(app)/policies/loading.tsx` |
| Tasks | `web/app/(app)/tasks/loading.tsx` |
| Quotes | `web/app/(app)/quotes/loading.tsx` |
| Broadcasts | `web/app/(app)/broadcasts/loading.tsx` |
| Dashboard | `web/app/(app)/dashboard/loading.tsx` — 5× KPI + 2× table blocks + third column |
| Analytics | `web/app/(app)/analytics/loading.tsx` — 8× KPI + 3× chart cards |
| Interactions | `web/app/(app)/interactions/loading.tsx` — sidebar list + main pane |

---

## 3. `PageFade` usage (client data surfaces)

Wrap **client** tables/shells that render server-fetched data so content **fades in** after navigation; **do not** wrap `loading.tsx` skeletons.

Examples: `LeadsTable`, `CustomersTable`, `QuotesTable`, `BroadcastsTable`, `TeamTable` inner content, `AnalyticsClient`, `InteractionsClient`, dashboard widgets (`KpiCards`, `RecentLeads`, `RecentTasks`, `UpcomingRenewals`), policies **card body** via `PageFade` in `web/app/(app)/policies/page.tsx` around table + pagination.

---

## 4. Empty states (copy + CTA matrix)

`EmptyState` is used for list/table empty rows where product copy applies.

| Area | Title | Subtitle (summary) | CTA |
|------|--------|----------------------|-----|
| `/leads` | No leads yet | Add your first lead… | **New lead** → `/leads?create=1` |
| `/customers` (no search) | No customers yet | Created when you convert… | **New customer** → `/customers?create=1` |
| `/policies` | No policies yet | Issue your first policy… | **New policy** → `/policies?create=1` |
| `/quotes` | No quotes yet | Create a quote for a lead… | **New quote** (opens create dialog) |
| `/broadcasts` | No broadcasts yet | WhatsApp segment… | **New broadcast** → `/broadcasts?create=1` |
| `/interactions` (no leads) | No leads found | Create a lead first… | **New lead** → `/leads?create=1` |
| `/analytics` | *(banner)* | No data yet — analytics appear… | *(none)* |
| Customer profile — linked policies | No policies linked | Issue a policy for this customer… | **Issue policy** → `/policies?create=1` |

**Filtered empty** (e.g. customers with active search but no rows) keeps a simple inline message (“No customers match your filters”) so we do not imply the whole book is empty.

---

## 5. Toasts (mutations)

- **Success:** entity-specific strings (e.g. “Lead created”, “Policy updated”, “Renewal check complete”, “Quote rejected”, “User removed”, “Settings saved”, billing flash with plan name, etc.).
- **Failure:** prefer **`toastMutationError(apiMessage)`** from `app-toast.ts` so errors are consistent (title + description).

---

## 6. Forms (RHF + shadcn `Form`)

- **`FormMessage`** (`web/components/ui/form.tsx`): inline errors use **`text-sm text-red-500 mt-1`** (field copy still comes from Zod in `lib/schemas.ts`).
- **`Input`** (`web/components/ui/input.tsx`): **`aria-invalid`** styling uses red border / ring tokens for invalid fields.
- **Submit buttons:** show **`InlineSpinner`** + unchanged label while pending; disabled while pending.

---

## 7. Confirm dialogs (policy & elsewhere)

- Titles are **action-specific** (“Delete this lead?”, “Delete this quote?”, …).
- Body includes **consequence** (“This cannot be undone.”) where applicable.
- **Delete** → `confirmVariant="destructive"`, label **Delete**.
- **Send / accept** style actions → `confirmVariant="default"` + **`confirmClassName`** indigo solid (see `QuoteRowActions`, `BroadcastRowActions`).

**Policies:** row delete uses **`ConfirmDialog`** (replaces legacy `window.confirm`).

---

## 8. Keyboard: **`N`** opens “new”

When the create dialog is **closed** and focus is not in an editable field, **`N`** opens the primary create affordance:

| Surface | Behavior |
|---------|----------|
| Leads | `LeadForm` — open dialog |
| Customers | `CustomerCreateLauncher` — open dialog |
| Policies | `CreatePolicyDialog` — open (disabled if no customers) |
| Quotes | `QuotesTable` — open create dialog |
| Broadcasts | `BroadcastForm` — open dialog |
| Team | `TeamTable` — open invite dialog |

**Escape:** Radix/shadcn `Dialog` closes on Escape by default; no extra code required.

---

## 9. Deep-link **`?create=1`**

| Page | Query | Client handling |
|------|-------|-----------------|
| Leads | `?create=1` | `LeadForm` `autoOpenCreate` + key remount |
| Customers | `?create=1` | `CustomerCreateLauncher` `autoOpenCreate` + `router.replace("/customers")` on close |
| Policies | `?create=1` | `CreatePolicyDialog` `autoOpenCreate` + key remount; `onOpenChange` clears query |
| Quotes | `?create=1` | `QuotesTable` (existing) |
| Broadcasts | `?create=1` | `BroadcastForm` (existing) |

---

## 10. Verification (web)

```bash
cd web
npx tsc --noEmit
npm run lint
npm run build
```

---

## 11. Changelog

| Date | Note |
|------|------|
| 2026-04-20 | Initial doc: skeletons, `loading.tsx` matrix, `PageFade`, `EmptyState`+actions, `toastMutationError`, form/input polish, `InlineSpinner`, `ConfirmDialog` extensions, `useKeyboardShortcut`, `?create=1` matrix. |

---

*Update this file when adding new data routes, empty states, or global UX patterns in `(app)/`.*
