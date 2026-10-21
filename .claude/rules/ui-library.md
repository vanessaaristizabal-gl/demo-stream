---
paths:
  - "frontend/package.json"
  - "frontend/tokens/**"
  - "frontend/src/design-system/**"
  - "frontend/.storybook/**"
---

# UI library and dependency policy

- Stack: our own **design system** (`src/design-system`, tokens in `tokens/tokens.json`) on **Reka UI** (MIT, headless, accessible primitives: dialog, radio group, tabs, accordion) with **Lucide** icons (ISC) and the **Inter** font (OFL). No styled third-party component kit.
- **Dependency policy: nothing that needs a paid license, license key, seat, account, token, subscription or private registry.** Allowed licenses: MIT, ISC, Apache-2.0, BSD, 0BSD, BlueOak, CC0, OFL (fonts). MPL-2.0 only for dev tools that are not shipped.
- Every dependency change must pass `npm run licenses` (frontend and backend). A hook runs it after `npm`/`composer` installs. Ask the user before adding anything outside the allowlist in `frontend/tools/check-licenses.mjs`; never edit the allowlist or ban list to make a package pass.
- Do not add a UI kit "just for one component". Prefer a native element, then a Reka UI primitive, then a small component of our own in `design-system`.
- Icons: Lucide only, always decorative (`aria-hidden`) unless the icon is the only label. No emojis, no second icon set.
- Components are exported from `src/design-system/index.ts`; features import `@/design-system`, never its internals (ESLint enforces it).
