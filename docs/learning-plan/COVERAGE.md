# Learning plan coverage (Claude Learning Plan: Sr. Web Developer, AdVise)

Each requirement of the plan, what proves it, and the command to show it. Verified 2026-10-20 on Node 26 (`nvm use` in `frontend/`; Node 20 cannot run Vitest 5).
"You" = needs a person; it cannot be generated.

## Week 1: foundations and skills
| Requirement | Status | Evidence / how to show |
|---|---|---|
| Claude Code works with the Gorilla Logic licence | You | Run `claude` and sign in with the licence |
| Sandbox: Vue 3 + TS, Vite, Router, Pinia, Vitest + VTU, ESLint, Storybook, Playwright | Done | `frontend/package.json`; `npm run check` |
| ESLint with the **Vue accessibility rules** | Partial | `eslint-plugin-vue` (incl. `vue/no-v-html` as error) plus axe in unit, Storybook and e2e. The dedicated `eslint-plugin-vuejs-accessibility` is **not installed**: CLAUDE.md requires asking before adding a dependency |
| Mock API with the 5 behaviours (preview with holds, partial apply, locked field, 2,000 rows, rate limit) | Done | `frontend/lab-api/handler.ts`, 15 tests in `handler.spec.ts` (`npx vitest run lab-api`) |
| Application shell: routing, mocked sign-in and session, typed API client with one error place, loading/empty/error states | Done (existing) | `src/app`, `src/shared/api/client.ts`, `src/features/auth` |
| Design language: tokens + base components with their states | Done (existing) | `frontend/tokens/tokens.json`, `src/design-system` (14 `Ds*` components), `npm run storybook` |
| Plan mode and permissions | You | Practise `/permissions`, plan mode (Shift+Tab); note when it asks |
| CLAUDE.md with the plan's conventions | Done | `CLAUDE.md` (screens, states, partial failure, keyboard, one test per criterion, no `v-html`, no real accounts) |
| Skill: spec to component, states, test per criterion, story per state | Done | `.claude/skills/screen-from-spec/SKILL.md`; traceability enforced by `npm run traceability` |
| Acceptance criteria written before running the skill | Drafted | `docs/specs/*.md` (40 criteria incl. edge cases and out of scope). **You must read, own and edit them**: the plan wants you to write them |
| Skill run on the two specs (300-item bulk with 12 retryable failures incl. rate limit; 30-character template) | Done | `BulkApprovalPreview`, `TemplateField`, views at `/lab/bulk`, `/lab/template` |
| Optional: 2,000-row list, inline edit rejected as locked | Done | `DenseList` at `/lab/rows` |
| Review everything, start the review log | Done | `REVIEW_LOG.md` |
| Construct walkthrough | You | Attend and note what to reuse |

## Week 2: subagents
| Requirement | Status | Evidence |
|---|---|---|
| Read-only reviewer subagent (tokens, states, a11y, criteria) | Done | `.claude/agents/screen-reviewer.md` (tools: Read, Glob, Grep, Bash) |
| Five planted weak screens | Done | `frontend/review-fixtures/weak-screens/` (outside `src/`, never built) |
| Reviewer catches all five; log what you changed | Done, see log | Reviewer run: all five FAIL with the planted defect found (REVIEW_LOG). First pass `npm run review:fixtures` catches 5/5 by script. Re-run the agent yourself for the check-in |
| Optional 4th spec (compliance or UTM) | Not done | Write a spec in `docs/specs/`, run `/screen-from-spec`, then the reviewer |
| axe in component tests + keyboard-only pass by hand | axe done; hand pass You | `src/shared/test/axe.ts`, used in the three component specs. Do the keyboard pass on `/lab/*` and log it |
| Generation and review as one step | Done | Steps 9 to 10 of the `screen-from-spec` skill call the reviewer |
| Optional: stories vs design language drift | Not done | |
| 15-minute usability check | You | `USABILITY_CHECK.md` |

## Week 3: hooks, MCP, plugins
| Requirement | Status | Evidence |
|---|---|---|
| Hook: lint (Vue rules), type check, affected tests after each component edit | Done | `.claude/hooks/format.mjs` (lint) + `verify.mjs` (vue-tsc, `vitest related`, screen check); proven by `frontend/tools/hooks.spec.ts` |
| Hook: block edits to env and secrets files | Done | `guard-files.mjs` (`.env*`, keys, certs, credentials, `.npmrc`, lockfiles); same spec |
| Playwright MCP connected; e2e drafted and checked by hand | Config done; drafting You | `.mcp.json` (pinned `@playwright/mcp@0.0.83`). The e2e in `e2e/lab.spec.ts` were written by hand and run, **not** drafted through the MCP: do one MCP walk and log the locators you reject |
| 2,000-row list with a performance budget that fails the build | Done | `perf-budget.json`; `e2e/perf.spec.ts` (DOM, rows, bytes, timings); `npm run build && npm run budget` (bundle). Lighthouse CI not used (needs extra dependencies); timing and structure tests instead |
| Optional Laravel partial-result endpoint | Not done | |
| Plugin: skill, reviewer, hooks; installs in a clean sandbox; conventions in a skill | Done | `plugins/stream-frontend-kit`; `claude plugin validate plugins --strict` passes; installed into an empty config dir (`CLAUDE_CONFIG_DIR`) and listed with 2 skills, 1 agent, 2 hooks, 1 MCP; `tools/plugin.spec.ts` |
| CI: lint, types, unit, Playwright + axe, performance budget on every push | Written, **not run** | `.github/workflows/ci.yml` (YAML parses; needs a GitHub push to prove) |
| One-page summary | Done | `SETUP_SUMMARY.md` |

## Throughout
| Practice | Status | Evidence |
|---|---|---|
| Design-language conformance | Done | `screen-lint`, reviewer, tokens only in lab components |
| Seeded defects | Done, see log | REVIEW_LOG "seeded defects" rows |
| Accessibility: axe on every component and flow + keyboard pass by hand | axe done; hand pass You | unit `expectNoA11yViolations`, `e2e/lab.spec.ts` (both themes, after partial failure, 320 px) |
| States and traceability | Done | `npm run traceability` |
| Security: no `v-html`, no secrets in the bundle, nothing trusted unread | Done | `vue/no-v-html` error, AC-15/AC-11 tests, guard hook |
| Review log with at least one rejected or corrected artifact per week | Week 1 done | `REVIEW_LOG.md`: add Week 2 and 3 entries as you work |

## Check-in scripts
- **Fri Oct 23:** `npm run dev`, show `/lab/*`, `npm run check`, open `docs/specs/`, run `/screen-from-spec` on a spec, show REVIEW_LOG. Be ready to explain without help: why the Idempotency-Key is kept on failure and renewed on success.
- **Fri Oct 30:** run the reviewer on the five fixtures, `npm run review:fixtures`, axe results, usability notes.
- **Fri Nov 6:** edit a `.env` file via Claude (blocked), break a type (hook fails), `npm run e2e`, `npm run build && npm run budget`, plugin install in a clean config dir, CI run.

## Not covered or not provable from here
Licence confirmation, Construct walkthrough, tutor-mode explanations, hand keyboard pass, usability session, MCP-drafted tests, 4th spec, CI run on GitHub, `eslint-plugin-vuejs-accessibility`, the `/design` skill, Claude certification.
