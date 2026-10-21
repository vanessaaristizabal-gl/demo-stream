---
paths:
  - "frontend/src/**/*.vue"
  - "frontend/index.html"
  - "frontend/e2e/**"
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
