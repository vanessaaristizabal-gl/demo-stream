# HTML and CSS standards (frontend)

The short, always-on constraints are in `.claude/rules/html-accessibility.md`, `.claude/rules/css.md` and `.claude/rules/dates-and-formats.md`. Accessibility checklist: [accessibility.md](accessibility.md).

## HTML
- Structure: one `<main>` per page, `<header>`/`<nav aria-label="Main">`, sections labelled by their heading (`aria-labelledby`). One `<h1>`; do not skip heading levels for styling, style with classes.
- Lists are `<ul>/<ol>`, tabular data is `<table>` (use `DsTable`, which adds a caption, `scope`, `aria-sort` and a keyboard-focusable scroll region). Do not use tables for layout.
- Links go somewhere (`href`), buttons do something (`type="button"` or `submit`). A link styled as a button is still a link.
- Forms: `<form @submit.prevent>`, `label for` + `id`, `required`, correct `type` and `autocomplete`, `inputmode` for numerics. Group related radios with `fieldset/legend`.
- Language: `<html lang>` is set; text in another language gets `lang`.
- No inline `style` except dynamic values; no `<br>` spacing; no emojis (Lucide icons only).

## CSS
- Tokens: semantic names only, for example `var(--ds-color-text-default)`, `--ds-color-bg-surface`, `--ds-color-action-primary-bg`, `--ds-color-border-default`, `--ds-space-4`, `--ds-radius-md`, `--ds-font-size-sm`, `--ds-size-control-md`. They come from `frontend/tokens/tokens.json` (`npm run tokens`); add a token there, for both themes, never a literal in a component.
- Layout: flex for one dimension, grid for two; `gap` not margins between siblings; `min-width: 0` on flex children that must shrink; `overflow-x: auto` on wide containers, never on `body`.
- Responsive: mobile first; the phone breakpoint is `max-width: 45rem`; test 320, 375, 768, 1280. Prefer intrinsic sizing (`minmax()`, `auto-fit`, `clamp()`) to many breakpoints.
- States: every interactive element has default, hover, `:focus-visible`, `:disabled` and (async) busy states. Disabled controls still meet contrast for their label where it is information.
- Dark mode: class `.app-dark` on `<html>`; write component styles with tokens so both themes work; check both in Storybook (theme toolbar).
- Motion: short transitions only; wrap larger motion in `@media (prefers-reduced-motion: no-preference)`. The global reset already shortens motion for users who opt out.
- Performance: no layout-shifting images (set `width`/`height`), no CSS framework or component kit on top of the design system.
