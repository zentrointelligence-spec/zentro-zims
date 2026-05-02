# ZIMS documentation

| Document | Purpose |
|----------|---------|
| [**PHASES-SHIPPED-SUMMARY.md**](./PHASES-SHIPPED-SUMMARY.md) | **Start here** — what we shipped **phase by phase** (0 → 1 → 2 → 3 + UX polish), with links to detail docs |
| [**00-CORE-ZIMS-PROGRAM.md**](./00-CORE-ZIMS-PROGRAM.md) | **Living core** — full cycle overview + master changelog |
| [PHASE-0-BACKEND-PLATFORM.md](./PHASE-0-BACKEND-PLATFORM.md) | FastAPI backend (done) |
| [PHASE-1-NEXTJS-WEB.md](./PHASE-1-NEXTJS-WEB.md) | Next.js web app (Phase 1 shipped) |
| [PHASE-2-ROADMAP.md](./PHASE-2-ROADMAP.md) | Phase 2 frontend/product — **in progress** (quotes, settings, CRM pages shipped; see table inside) |
| [PHASE-3-MARKETING-WEB.md](./PHASE-3-MARKETING-WEB.md) | Phase 3 public marketing — `/`, `/pricing`, `/blog` (static/SSG, no API) |
| [WEB-APP-UI-POLISH.md](./WEB-APP-UI-POLISH.md) | Authenticated app UX polish — skeletons, empty states, toasts, `PageFade`, shortcuts, `?create=1` |

**Rule of thumb:** after a meaningful change, append one line to the **Changelog** in `00-CORE-ZIMS-PROGRAM.md`, update the relevant **phase** file, and extend **[`PHASES-SHIPPED-SUMMARY.md`](./PHASES-SHIPPED-SUMMARY.md)** if the milestone crosses a phase boundary or adds a major shipped surface. Root [`README.md`](../README.md) and [`web/README.md`](../web/README.md) should stay aligned with user-visible routes and major API additions.
