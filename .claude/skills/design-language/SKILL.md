---
name: design-language
description: The Stream design language as rules a generator can follow: tokens, base components, required states, accessibility and security rules. Load before writing or reviewing any Vue screen or component. It carries the conventions that CLAUDE.md carries in this repo, so a plugin that ships it works in a project without that file.
---

# Stream design language

The design language is decided and written by a person (`frontend/tokens/tokens.json`, `docs/standards/`). A generator follows it; it never invents it.

## Tokens and base components
- Colour, spacing, type, radius and size come from semantic tokens only: `var(--ds-color-*)`, `var(--ds-space-*)`, `var(--ds-font-*)`, `var(--ds-radius-*)`, `var(--ds-size-*)`. No hex, rgb or hsl. No `px` for spacing. No primitive tokens in components.
- Use the base components from `@/design-system` before writing markup: `DsButton` (variant, size, loading, disabled), `DsTable` (+ `useTable`), `DsInput`, `DsSelect`, `DsSegmented`, `DsMessage` (tone: info, success, warning, danger), `DsTag`, `DsCard`, `DsEmptyState`, `DsPagination`, `DsConfirmDialog`, `DsBreadcrumb`; and `StatusBadge`, `DateText` from `@/shared`. Import the public barrel, never `design-system/components/*`.
- If a base component cannot do it, say so and propose extending the base component; do not fork its styles into a screen.
- Icons are Lucide, decorative (`aria-hidden="true"`). No emojis anywhere.
- Dates are shown only through `shared/utils/format.ts` or `<DateText>`; money is integer cents shown with `formatMoney`.

## States every screen handles
- **Loading** (`role="status"`), **empty** (says why and what to do), **error** (`DsMessage tone="danger"` with a retry) for everything that loads.
- **Partial failure** wherever a batch can fail: applied count, failed count, each failed item with its reason, a retry for the retryable ones, success only when nothing failed.
- One Storybook story per state. One test per acceptance criterion, titled `AC-<n>: ...`.

## Accessibility (WCAG 2.2 AA)
- Native elements first. Every control has an accessible name; every input a visible label; errors are tied to the field with `aria-describedby` and `aria-invalid`.
- Everything works by keyboard. When the focused control disappears or is replaced, move focus somewhere sensible. Results that appear after an action are announced (`role="status"` / `role="alert"`) and receive focus when they replace the control used.
- State is never colour alone. Works at 320 px without sideways page scroll, in light and dark themes.
- Every page has a breadcrumb; nested pages (route `meta.parent`) also have Back; main pages never show Back.

## Information design and navigation
- A page has one job and its sections one task each: peer views go in `DsTabs` (state in the URL with `useTabQuery`), optional or nested detail in `DsAccordion`, sequences in a wizard that ends in a preview and one approval. Never stack many blocks on one page.
- Errors, partial failures, held items and locks are never hidden in a closed panel or inactive tab without a count or status in the label.
- Inactive tabs and closed sections mount nothing; lists beyond about 100 rows are paged by the server; refreshing keeps controls mounted. Full rule: `.claude/rules/ux-information-design.md`.

## Security
- Never `v-html` / `innerHTML` with text a user typed or the server returned. Render text.
- No secrets, tokens or credentials in the bundle. Never call real external accounts: the Google Ads and Meta providers are driven by fakes (`PROVIDERS_DRIVER=fake`).
- Every write request carries an `Idempotency-Key`; keep the key while retrying the same intent and renew it once the server has answered.
- Lists of hundreds of rows are paged, filtered and sorted by the server.

## Checks
`npm run typecheck`, `npm run lint`, `npm test`, `npm run traceability`, `node tools/screen-lint.mjs <screen.vue>`, then the `screen-reviewer` agent.
