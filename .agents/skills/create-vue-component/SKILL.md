---
name: create-vue-component
description: Scaffold a Vue 3 + TypeScript component with its Vitest spec and Storybook stories in the right layer (design system, feature, or shared). Use when the user asks to create a component, widget or UI piece.
---

# Create a Vue component

1. **Pick the layer** (this decides everything else):
   - `--ds` : generic, no business knowledge (`DsBadge`, `DsTabs`). Lives in `src/design-system/components`, named `Ds*`, exported from the barrel. Uses semantic tokens only. Must not import features, app or shared.
   - `--feature <name>` : knows the domain (whatever folder exists under `src/features/`: today `accounts`, `campaigns` (with its `approvals/`, `simulated/`, `bulk/` and `copy/` areas), `changelog`, `system`, `auth`). Lives in `src/features/<name>/components`. May use `@/design-system` and `@/shared`, never another feature.
   - `--shared` : domain-aware but used by several features (`StatusBadge`, `DateText`). Lives in `src/shared/components`.
2. Scaffold (from the repo root):
   ```bash
   node .claude/skills/create-vue-component/scripts/new-component.mjs DsBadge --ds
   node .claude/skills/create-vue-component/scripts/new-component.mjs LockBadge --feature campaigns
   ```
   It creates `<Name>.vue`, `<Name>.spec.ts`, `<Name>.stories.ts`, refuses to overwrite, and (for `--ds`) adds the export to `src/design-system/index.ts`. A scaffold left as-is is not done.
3. Components are presentational: props in, events out, no stores, no API calls. Views own stores.
4. Build it from what exists before writing new things: `DsButton`, `DsInput`, `DsSelect`, `DsSegmented`, `DsTable`, `DsTabs`, `DsAccordion`, `DsMessage`, `DsTag`, `DsCard`, `DsConfirmDialog`, `DsPagination`, `StatusBadge`, `DateText`, `BatchPreview`, `BatchReceipts`, Lucide icons, `shared/utils/format.ts`.
5. Checklist:
   - Props via `defineProps<{...}>()`, emits via `defineEmits<{ name: [payload] }>()`, v-model via `defineModel`. No `any`.
   - Styling from tokens only (`var(--ds-*)`, semantic names). No raw hex, no primitive tokens, no new libraries (rules `css` and `ui-library`; guidance in `docs/standards/html-css.md`).
   - WCAG 2.2 AA: work through `docs/standards/accessibility.md` (semantics, names, keyboard, focus lifecycle, contrast in both themes, 320 px reflow). Icons are Lucide, decorative (`aria-hidden`); no emojis.
   - Dates and money through `format.ts` / `DateText`, never `toLocale*String` (ESLint fails it).
   - Spec: behaviour (rendered text, emitted events with payloads, disabled states, roles and names), not snapshots.
   - Stories: one per visual state (default, empty, loading, error, disabled/locked); a `play` function for interactions via `storybook/test`. Check both themes with the toolbar.
6. Verify from `frontend/`: `npm run typecheck && npm run lint && npm test`; `npm run build-storybook` when stories changed; `npm run e2e -- e2e/a11y.spec.ts` if it appears on a page.
