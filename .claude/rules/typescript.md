---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.vue"
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
