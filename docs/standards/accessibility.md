# Accessibility standard (WCAG 2.2 AA)

Note on versions: the current W3C standard is **WCAG 2.2** (2.3 does not exist; WCAG 3.0 is a draft). We target 2.2 level AA, which includes 2.0 and 2.1.

## Build checklist (with the success criterion it satisfies)
1. **Semantics (1.3.1, 4.1.2)** - native `button`, `a`, `input`, `select`, `table` (`th scope`/`caption` or `aria-label`), landmarks (`header`, `nav`, `main`), headings in order. ARIA only when no native element exists; do not add widget ARIA to unsupported elements.
2. **Names and labels (1.1.1, 2.4.6, 3.3.2)** - visible `<label for>` on every control; icon-only buttons get `aria-label`; decorative icons `aria-hidden="true"`; images have `alt`. The accessible name should contain the visible text (2.5.3).
3. **Keyboard (2.1.1, 2.1.2, 2.4.3)** - everything operable with Tab/Shift+Tab/Enter/Space/Arrows as the widget pattern requires; logical focus order; no traps; move focus into and back out of dialogs.
4. **Focus (2.4.7, 2.4.11)** - visible `:focus-visible` indicator, 3:1 against adjacent colors; focused element is never hidden behind sticky headers/banners (`scroll-margin-top`).
5. **Contrast (1.4.3, 1.4.11)** - text 4.5:1 (large 3:1); icons, input borders and focus rings 3:1; both themes. Tokens live in `frontend/tokens/tokens.json` with light and dark values and a `contrast` list that `npm test` checks (4.5:1 text, 3:1 controls and focus).
6. **Not color alone (1.4.1)** - status tags carry text; errors have text and an icon, not only red.
7. **Reflow and zoom (1.4.4, 1.4.10, 1.4.12)** - usable at 320 CSS px and 200% zoom, no page-level horizontal scroll (data tables may scroll inside their container), `rem` units, no fixed heights on text containers.
8. **Target size (2.5.8)** - at least 24x24 CSS px (we use 40px min height for buttons).
9. **Status messages (4.1.3)** - `role="alert"` for errors that need attention, `role="status"` for confirmations; the element exists before its text changes when possible.
10. **Motion (2.2.2, 2.3.1, 2.3.3)** - nothing flashes more than 3 times per second; honor `prefers-reduced-motion`; no auto-moving content without a pause control.
11. **Forms (3.3.1, 3.3.3, 3.3.7, 1.3.5)** - errors identified in text and tied via `aria-describedby`; `autocomplete` tokens on identity fields; do not make users retype data already given.
12. **Authentication (3.3.8)** - allow paste and password managers; no puzzles or memory tests. Our show/hide password control is a button with `aria-pressed` and a label that states the action.
13. **Consistent (3.2.3, 3.2.4, 3.2.6)** - navigation and help appear in the same place across views.
14. **Orientation (2.4.8 AAA, we do it anyway)** - every page has a breadcrumb (`DsBreadcrumb`, `aria-label="Breadcrumb"`, last item `aria-current="page"`) and, on nested pages only, a Back button (main pages never show it). Dates use `<time datetime>` via `DateText`.
15. **Focus lifecycle (2.4.3)** - when the control that has focus is removed (`v-if`), disabled or replaced, move focus on purpose: engage/resume moves it to the banner or main, a pager that disables the used button focuses the other one, a failed action keeps the dialog open and shows the error. Never leave focus on `<body>`.
16. **Bypass and sticky UI (2.4.1, 2.4.11)** - a skip link is the first tab stop and moves focus to `#main` (`tabindex="-1"`); `html { scroll-padding-top }` keeps focused elements from hiding under the sticky header.
17. **Selected and current state (1.4.1)** - never only a background color: add a check mark, underline or inset indicator (`DsSegmented`, active nav link), and list the pair in `tokens.json` `contrast`.
18. **Modals** - use `DsConfirmDialog` (Reka AlertDialog): focus trapped, Escape cancels, focus returns to the trigger, labelled and described.

## Verify (all three, not just one)
- **Automated**: `cd frontend && npm run e2e -- e2e/a11y.spec.ts` runs axe (tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`) on every page in light and dark, plus 375 px phone checks (no page scroll, no clipped button labels). Add new pages to that spec.
- **Storybook**: `npm run storybook`, open the Accessibility panel on each story; `preview.ts` sets `a11y.test: 'error'`. Use the theme toolbar to check dark.
- **Manual, always** (axe finds roughly a third of issues): Tab through the page with the mouse unplugged; zoom to 200%; check with VoiceOver (macOS: Cmd+F5) that names, roles and state changes are announced.

## Writing a component
Use the design system (`DsButton`, `DsInput`, `DsSelect`, `DsTable`, `DsMessage`, `DsConfirmDialog`, `DsBreadcrumb`...), `StatusBadge`, `DateText` and Lucide icons. A story per state and a spec that asserts the accessible name/role (`getByRole`) rather than classes. If axe flags something, fix the cause; never exclude a rule or node to get green, and say so if a violation comes from the library.
