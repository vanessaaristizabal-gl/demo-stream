---
name: frontend-conventions
description: The Stream front end's rules in one place: TypeScript, UI library and dependency policy, CSS tokens, HTML and accessibility, dates and money formats, and how tests are written. Load before writing or reviewing front-end code; the reviewer agents read it.
---

# TypeScript rules (frontend)

- `strict` stays on. No `any` (ESLint enforces it); use `unknown` and narrow. No `@ts-ignore`; `@ts-expect-error` only with a reason.
- No non-null `!` on values that can really be null. Prefer `satisfies` over `as`; never `as` across unrelated types.
- Discriminated unions, not parallel booleans. String-literal unions, not `enum` (`erasableSyntaxOnly`: no `enum`, no class parameter properties, no `namespace`).
- Exported functions have explicit return types. Props/emits via `defineProps<{...}>()` / `defineEmits<{ evt: [payload] }>()`; v-model via `defineModel`.
- Never swallow errors: catch only where you can act. Reset loading flags in `finally`.
- Money is integer cents; dates are ISO strings parsed and formatted only in `shared/utils/format.ts` (see `dates-and-formats`).
- Layers (ESLint enforces): `app` uses `features`; `features` and `shared` use `design-system` only through `@/design-system`; `design-system` and `shared` never import features or app; features never import each other (identity, `@/features/auth`, is the one shared feature). Compose in `app`.
- All HTTP goes through `src/shared/api/client.ts`; API types live in `src/shared/api/types.ts`. Single resources arrive as `{ data }`, lists as `{ data, meta }`.
- Imports use the `@/` alias. Each feature owns `store.ts`, `components/`, `views/`.

Reasoning, patterns and examples: `docs/standards/typescript.md` (read it when designing types, composables or stores).

---

# UI library and dependency policy

- Stack: our own **design system** (`src/design-system`, tokens in `tokens/tokens.json`) on **Reka UI** (MIT, headless, accessible primitives: dialog, radio group, tabs, accordion) with **Lucide** icons (ISC) and the **Inter** font (OFL). No styled third-party component kit.
- **Dependency policy: nothing that needs a paid license, license key, seat, account, token, subscription or private registry.** Allowed licenses: MIT, ISC, Apache-2.0, BSD, 0BSD, BlueOak, CC0, OFL (fonts). MPL-2.0 only for dev tools that are not shipped.
- Every dependency change must pass `npm run licenses` (frontend and backend). A hook runs it after `npm`/`composer` installs. Ask the user before adding anything outside the allowlist in `frontend/tools/check-licenses.mjs`; never edit the allowlist or ban list to make a package pass.
- Do not add a UI kit "just for one component". Prefer a native element, then a Reka UI primitive, then a small component of our own in `design-system`.
- Icons: Lucide only, always decorative (`aria-hidden`) unless the icon is the only label. No emojis, no second icon set.
- Components are exported from `src/design-system/index.ts`; features import `@/design-system`, never its internals (ESLint enforces it).

---

# CSS and design tokens

- **Everything visual is a token.** Source of truth: `frontend/tokens/tokens.json` (primitives, semantic light/dark, contrast pairs). `src/design-system/tokens/tokens.css` and `tokens.ts` are generated from it (a hook does it on save, and `npm run tokens` runs before dev/build/Storybook); never edit the generated files.
- Components use **semantic** tokens only (`var(--ds-color-text-muted)`, `--ds-space-4`, `--ds-radius-md`, `--ds-font-size-sm`, `--ds-size-control-md`...). Never primitives (`--ds-color-blue-700`) and never raw hex, px colors, or ad-hoc font sizes. A unit test fails on raw hex, unknown `--ds-*` names, and primitive use in components.
- To change or add a color: edit `tokens.json` for BOTH `light` and `dark`, add its contrast pair to `contrast`, then run `npm test`. The test enforces WCAG 2.2 (text 4.5:1, controls and focus 3:1) in both themes.
- Mobile first and fluid; phone breakpoint `max-width: 45rem` (the `--ds-breakpoint-md` value; media queries cannot read variables). Reflow at 320 CSS px with no page-level horizontal scroll; wide tables scroll inside `DsTable`.
- `rem` for type and spacing so zoom and text-size settings work. Never disable zoom.
- Keep the global `:focus-visible` ring; never remove an outline without an equal replacement. Respect `prefers-reduced-motion`.
- Dark mode is the `.app-dark` class on `<html>` (`useTheme`, plus an inline script in `index.html` that applies it before first paint).
- Scoped styles in SFCs; avoid `!important`; `:deep()` only for third-party DOM. Portalled content (dialogs) uses namespaced global CSS.

Structure, forms, layout and dark-mode guidance: `docs/standards/html-css.md`.

---

# HTML and accessibility rules (target: WCAG 2.2 AA)

- Semantic first: `<button>` for actions, `<a href>` for navigation, `<main>`, `<nav aria-label>`, `<header>`, real headings in order (one `<h1>` per view). Never `div`/`span` with `@click`.
- Every form control has a visible `<label for>`; errors are text (not color alone), linked with `aria-describedby`, and announced (`role="alert"` for blocking errors, `role="status"` for confirmations).
- Icon-only controls need an accessible name (`aria-label`); decorative icons get `aria-hidden="true"`. No emojis anywhere in the UI: use Lucide icons.
- Do not put ARIA widget attributes on elements that do not support them (axe `aria-allowed-attr`); prefer native elements over ARIA.
- Color contrast: text 4.5:1 (3:1 large), UI components and focus indicators 3:1, in light and dark. Never convey state by color alone.
- Everything works by keyboard, with a visible focus indicator; no keyboard traps; interactive targets at least 24x24 CSS px.
- Login: allow paste and password managers, no cognitive tests (3.3.8).
- Every page has a breadcrumb trail (`meta.crumb`/`meta.parent` on its route, `useCrumbLabel` for dynamic names). Nested pages (a route with `meta.parent`) also get a Back button; main pages (accounts, campaigns, changelog) never do, because the main navigation is already their way around. Back never dead-ends: with no history it goes to the parent.
- New or changed UI must pass `npm run e2e -- e2e/a11y.spec.ts` (axe, light and dark, plus 375 px phone checks) and its Storybook a11y panel.

Full checklist with the WCAG criterion for each point, and how to verify (axe, Storybook, manual): `docs/standards/accessibility.md`. Read it when building or changing UI.

---

# Dates, money and display formats

**API and database:** timestamps are stored in UTC and leave the API as ISO 8601 with an offset (`2026-10-15T16:07:03+00:00`, Carbon `toIso8601String()`). Money is integer cents. Never send pre-formatted dates or money from the API. A new date field goes in its Resource, in the model `@property` docblock, and in `docs/openapi.json` (`php artisan scramble:export`).

**UI:** one module decides how data looks, `frontend/src/shared/utils/format.ts`:
- date: `formatDate` gives "Oct 15, 2026"; date and time: `formatDateTime` gives "Oct 15, 2026, 4:07 PM"; unambiguous: `formatDateTimeLong` (tooltips); money: `formatMoney` gives "$100.00"; missing or invalid values show an em dash, never "Invalid Date".
- Render dates with `<DateText :value="iso" />` (`shared/components`), which outputs a semantic `<time datetime>` with a full time-zone tooltip. Sort date columns with `dateSortKey`.
- Locale is fixed `en-US` (US client); time zone is the viewer's.
- Never call `toLocaleDateString`, `toLocaleTimeString`, `toLocaleString` or build `Intl.DateTimeFormat`/`NumberFormat` in components: ESLint fails the edit (and a hook reports it right after you save).
- A new displayed value type (percent, duration, ...) is added to `format.ts` with a spec, not inline.

The semantics of `<time>` and the rest of the accessibility checklist: `docs/standards/accessibility.md`.

---

# Frontend testing (Vitest, Playwright, Storybook)

**Unit (Vitest + `@vue/test-utils`)**
- Assert behaviour a user or caller can observe (text, roles and names, emitted events with payloads, disabled states), not snapshots or implementation details. Find controls through their label or role, never a CSS class.
- Stores: a real `createPinia()` and `vi.mock('@/shared/api/client')` keeping `ApiError` real (`importActual`); assert the exact URL, method and headers sent, and that a failed action leaves state unchanged.
- Composables: test them directly; wrap anything that uses `onScopeDispose` in `effectScope()`. Composables that read `history.state` need `createWebHistory()` (memory history keeps none) and must destroy the router after each test.
- Components that portal (dialogs): `attachTo: document.body`, query `document.body`, and treat `data-state="open"` as open (Reka keeps a closing dialog mounted for its exit animation).
- Each `mount()` is its own app, so ids from `useId()` repeat across mounts; test uniqueness inside one parent.
- Fixtures live in `src/shared/test/factories.ts`; keep them in step with `src/shared/api/types.ts`.

**E2E (Playwright, Laravel API mocked in `e2e/mock-api.ts`; bulk operations and launches run on the dev-only mock in `mock-backend/`, served by Vite at `/api/playbooks`, whose state is shared by the whole dev server: those specs are serial inside their file, and `POST /api/playbooks/reset` only rebuilds the bulk batch, so launches in other files never interfere)**
- Route with a **pathname predicate** (`url.pathname.startsWith('/api/')`), never the glob `**/api/**`: it also catches Vite's `/src/shared/api/*.ts` modules and blanks the app.
- Wait for the page to be ready (`await expect(heading).toBeVisible()`) before navigating by click; a click during the first navigation is resolved by the router as a `replace`, so history-dependent behaviour changes.
- Use web-first assertions; no `waitForTimeout`. Locale and time zone are fixed in `playwright.config.ts`, so formatted dates are the same everywhere.
- Cover the unhappy path too (server error shown, control hidden for the wrong role). New pages go into `e2e/a11y.spec.ts` (axe, both themes) and the phone checks.
- When the Laravel response shape changes, update `mock-api.ts` and `src/shared/api/types.ts` in the same change.
- Accessibility and performance of whole pages: `npm run audit:devtools` (Chrome DevTools MCP: accessibility tree, Lighthouse desktop and mobile, LCP and CLS; limits in `perf-budget.json`). Axe in unit specs: `expectNoA11yViolations` from `@/shared/test/axe`.

**Storybook:** one story per visual state, `play` functions for interactions, check both themes with the toolbar; the a11y addon is set to fail.

**Always:** prove a new test bites (break the code, watch it fail, restore). Never weaken a test, an arch test, a lint rule or a contrast pair to get green. Report exact results of `npm test`, `npm run e2e`, `npm run check`.
