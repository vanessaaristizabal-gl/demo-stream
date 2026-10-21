---
name: screen-from-spec
description: Turn a written screen spec with acceptance criteria (docs/specs/*.md) into a Vue component, every state, one component test per criterion and one Storybook story per state, then have the screen-reviewer agent check it. Use when asked to build a screen from a spec, or to regenerate one after the spec changed.
argument-hint: "<spec file, e.g. docs/specs/bulk-approval-preview.md>"
allowed-tools: Read Write Edit Glob Grep Bash(npm run *) Bash(node tools/*) Bash(npx vitest *) Agent
---

# Screen from spec

Input: `$ARGUMENTS`, a spec in `docs/specs/` (format in `docs/specs/README.md`). The spec is written by a person and owns the truth: if the code and the spec disagree, the code is wrong. If a criterion is ambiguous or untestable, stop and ask; do not guess it.

## Steps
1. **Read** the spec, the `design-language` skill, and one finished screen in the project to match its style (in the Stream repo: `frontend/src/shared/components/BatchPreview.vue` with its `.spec.ts` and `.stories.ts`). Check which base components exist in the design system's public barrel (`frontend/src/design-system/index.ts`).
2. **Explain before generating** (the user is learning): in a few lines, say which component props and events the criteria imply, which states map to which props, and what would break without each guard (for example the focus move, the idempotency key). Wait for objections only if something is unclear.
3. **Scaffold** the component, its spec and its stories at the path in the spec's `Component:` line (in the Stream repo: `node .claude/skills/create-vue-component/scripts/new-component.mjs <Name> --feature <feature>`). A scaffold left as-is is not done.
4. **Component**: presentational (props in, events out; stores and API calls live in the view). Tokens and `Ds*` components only. Handle every state in the spec's States list, and `partial-failure` for any batch. Render server text as text.
5. **Tests**: one `it('AC-<n>: <criterion in words>', ...)` per criterion, edge cases included, asserting what a user can observe (text, roles and names, emitted events with payloads, disabled and busy state). Find controls by role or label, never by CSS class. Add `expectNoA11yViolations(wrapper)` (from `@/shared/test/axe`) to at least one test. Titles must start with the AC id exactly; `npm run traceability` parses them.
6. **Stories**: one exported story per state, named in PascalCase from the state (`partial-failure` is `PartialFailure`), with `args` that put the component in that state.
7. **Prove the tests bite**: pick two criteria, break the code that satisfies them, watch their tests fail, restore. Report which you broke.
8. **Check** from the front-end folder: `npm run typecheck && npm run lint && npm test`, plus, where the project has them, `npm run traceability` and `node tools/screen-lint.mjs <the .vue>`. Fix until green; never weaken a test or a rule to get there.
9. **Review**: ask the `screen-reviewer` agent to review the screen with its spec (give it the paths, not your opinion of the result). Fix what it reports, or write down why a finding is wrong.
10. **Log**: add a row to `docs/learning-plan/REVIEW_LOG.md` for anything you rejected or corrected in your own first draft, or that the reviewer caught.

## Do not
Invent acceptance criteria, add dependencies, edit tokens, copy styles into a screen, add a second API path, or call a real account. Dates and money go through `format.ts`.
