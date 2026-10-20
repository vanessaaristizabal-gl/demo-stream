# TypeScript standards (frontend)

The short, always-on constraints are in `.claude/rules/typescript.md`; this page has the reasoning and patterns.

## Types
- Prefer `unknown` to `any`, then narrow. Parse untrusted data (API, storage) at the boundary into a typed value; do not cast.
  ```ts
  const payload: unknown = await response.json().catch(() => null)
  const p = (payload ?? {}) as { message?: string }   // acceptable only at a boundary, right before use
  ```
- Discriminated unions over flags: `type Load = { state: 'idle' } | { state: 'loading' } | { state: 'error'; error: Error } | { state: 'ok'; data: T }`. Exhaustiveness: `default: { const _never: never = x }`.
- String-literal unions instead of `enum` (`erasableSyntaxOnly`). `as const` objects when you need runtime values: `const ROLES = ['strategist','approver','admin'] as const; type Role = typeof ROLES[number]`.
- `satisfies` checks a literal against a type without widening it (Storybook `meta`, config objects).
- Narrow with guards and `in`/`typeof`; write `function isApiError(e: unknown): e is ApiError`.
- Generics: constrain them (`<T extends { id: number }>`), do not default to `any`. Do not over-engineer: a plain function type beats a clever conditional type.
- `readonly` arrays/props for inputs you must not mutate; return new objects.

## Errors and async
- `async` functions return `Promise<T>`; never leave a floating promise (`void fn()` when intentional, or await it).
- `try/finally` to reset loading state. Catch to translate or display; never `catch {}` silently unless the failure is truly irrelevant (document why).
- Type thrown values as `unknown`; use `e instanceof Error`.

## Vue + Pinia
- `defineProps<{ a: string; b?: number }>()` with `withDefaults` for defaults; `defineEmits<{ select: [id: number] }>()`; `defineModel<string>()` for v-model.
- Setup stores return only what consumers need; derive with `computed`, never duplicate state. `storeToRefs` when destructuring state.
- Template refs and DOM: type them (`ref<HTMLInputElement | null>(null)`) and null-check.
- Composables: `use*` naming, return refs/functions, clean up with `onScopeDispose`.

## Tests
- Test types too: a spec that compiles only if the contract holds is cheap. Keep `npm run typecheck` green; it runs `vue-tsc` over specs and stories.
- Never loosen a type to make a test compile; fix the test or the code.

## Before you finish
`cd frontend && npm run typecheck && npm run lint && npm test`.
