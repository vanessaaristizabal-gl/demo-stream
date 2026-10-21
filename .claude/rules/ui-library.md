---
paths:
  - "frontend/package.json"
  - "frontend/tokens/**"
  - "frontend/src/design-system/**"
  - "frontend/.storybook/**"
---

# UI library and dependency policy

- Stack: our own **design system** (`src/design-system`, tokens in `tokens/tokens.json`) on **Reka UI** (MIT, headless, accessible primitives: dialog, radio group, tabs, accordion) with **Lucide** icons (ISC) and the **Inter** font (OFL). No styled third-party component kit.
- Do not add a UI kit "just for one component". Prefer a native element, then a Reka UI primitive, then a small component of our own in `design-system`.
- Icons: Lucide only, always decorative (`aria-hidden`) unless the icon is the only label. No emojis, no second icon set.
- Components are exported from `src/design-system/index.ts`; features import `@/design-system`, never its internals (ESLint enforces it).
