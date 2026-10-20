---
paths:
  - "frontend/src/**/*.css"
  - "frontend/src/**/*.vue"
  - "frontend/tokens/**"
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
