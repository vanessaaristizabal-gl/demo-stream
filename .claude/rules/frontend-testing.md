---
paths:
  - "frontend/**/*.spec.ts"
  - "frontend/e2e/**"
  - "frontend/src/shared/test/**"
---

# Frontend testing (Vitest, Playwright, Storybook)

**Unit (Vitest + `@vue/test-utils`)**
- Assert behaviour a user or caller can observe (text, roles and names, emitted events with payloads, disabled states), not snapshots or implementation details. Find controls through their label or role, never a CSS class.
- Stores: a real `createPinia()` and `vi.mock('@/shared/api/client')` keeping `ApiError` real (`importActual`); assert the exact URL, method and headers sent, and that a failed action leaves state unchanged.
- Composables: test them directly; wrap anything that uses `onScopeDispose` in `effectScope()`. Composables that read `history.state` need `createWebHistory()` (memory history keeps none) and must destroy the router after each test.
- Components that portal (dialogs): `attachTo: document.body`, query `document.body`, and treat `data-state="open"` as open (Reka keeps a closing dialog mounted for its exit animation).
- Each `mount()` is its own app, so ids from `useId()` repeat across mounts; test uniqueness inside one parent.
- Fixtures live in `src/shared/test/factories.ts`; keep them in step with `src/shared/api/types.ts`.

**E2E (Playwright, API mocked in `e2e/mock-api.ts`)**
- Route with a **pathname predicate** (`url.pathname.startsWith('/api/')`), never the glob `**/api/**`: it also catches Vite's `/src/shared/api/*.ts` modules and blanks the app.
- Wait for the page to be ready (`await expect(heading).toBeVisible()`) before navigating by click; a click during the first navigation is resolved by the router as a `replace`, so history-dependent behaviour changes.
- Use web-first assertions; no `waitForTimeout`. Locale and time zone are fixed in `playwright.config.ts`, so formatted dates are the same everywhere.
- Cover the unhappy path too (server error shown, control hidden for the wrong role). New pages go into `e2e/a11y.spec.ts` (axe, both themes) and the phone checks.
- When the Laravel response shape changes, update `mock-api.ts` and `src/shared/api/types.ts` in the same change.

**Storybook:** one story per visual state, `play` functions for interactions, check both themes with the toolbar; the a11y addon is set to fail.

**Always:** prove a new test bites (break the code, watch it fail, restore). Never weaken a test, an arch test, a lint rule or a contrast pair to get green. Report exact results of `npm test`, `npm run e2e`, `npm run check`.
