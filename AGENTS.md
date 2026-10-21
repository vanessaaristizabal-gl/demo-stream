<!-- Generated from CLAUDE.md by frontend/tools/sync-codex.mjs. Edit CLAUDE.md, then run `npm run sync:codex`. -->
# Stream: campaign operations platform

Monorepo: `backend/` (Laravel 13, PHP 8.4, Pest, Sanctum, Scramble) and `frontend/` (Vue 3 + TypeScript, Pinia, Vitest, Storybook, Playwright). Domain: governed changes to Google Ads and Meta campaigns for car dealerships.

## The product rule
Every change to a live ad account goes through `backend/app/Domain/Governance/WritePath/GovernedWritePath.php`: resolve against live state, compliance, approval (person or pre-approved policy), dry run, write, receipt. Only the Governance module may use the write side of a provider; `backend/tests/Arch` enforces it. Never add a second write path.

## Architecture in one screen
- Backend: modular monolith, `app/Domain/{Identity,Advertising,Compliance,Governance,Changelog,Playbooks}`, thin controllers, FormRequests in, API Resources out. API docs by Scramble at `/docs/api`, committed as `docs/openapi.json`.
- Frontend: `src/design-system` (tokens + `Ds*` components on Reka UI + Lucide, no UI kit), `src/shared` (api client, types, formatters, composables), `src/features/<feature>` (store, components, views), `src/app` (shell, router, layout). Boundaries are enforced by ESLint.
- Design tokens live in `frontend/tokens/tokens.json` and generate the CSS variables; components use semantic tokens only.
- Details: `docs/architecture.md` and `docs/adr/`.

## Commands
- Backend (`cd backend`): `./vendor/bin/pest`, `./vendor/bin/pint --test`, `./vendor/bin/phpstan analyse`, `php artisan migrate --seed`, `php artisan serve`, `php artisan scramble:export`
- Frontend (`cd frontend`, Node 22+, `.nvmrc` says 26): `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run tokens`, `npm run licenses`, `npm run storybook`, `npm run e2e`, `npm run check`, `npm run traceability` (every acceptance criterion has a test, every state a story), `npm run build && npm run budget` (performance budget in `frontend/perf-budget.json`), `npm run review:fixtures`, `npm run audit:devtools` (accessibility tree, Lighthouse desktop and mobile, LCP and CLS through the Chrome DevTools MCP; needs the dev server and the backend), `npm run plugin:build`

## Non-negotiables
- **Dependencies must be free**: no paid licenses, license keys, seats, accounts, tokens, subscriptions or private registries. `npm run licenses` checks frontend and backend; a hook runs it after installs. Ask before adding any dependency outside the allowlist, and never edit the allowlist to make a package pass.
- UI: WCAG 2.2 AA, responsive down to 320 px, Lucide icons only, no emojis, light and dark themes.
- Screens: tokens and `Ds*` base components only (no hex, no px spacing). Every screen handles loading, empty and error, and **partial failure wherever a batch can fail** (applied, failed with reasons, retry; success only when nothing failed). Every interactive element works by keyboard and focus is never lost when a control disappears. Lists of hundreds of rows are paged, filtered and sorted by the server.
- UX: pages are organised, not stacked: tabs for peer views, accordions for optional detail, a wizard for sequences; nothing important hidden in a closed panel; the tab lives in the URL. Rule: `.claude/rules/ux-information-design.md`.
- Security: never `v-html` with text a user typed or the server returned (ESLint `vue/no-v-html` is an error), no secrets or tokens in the bundle, never call real external accounts.
- Specs: a screen starts from a written spec in `docs/specs/` with testable acceptance criteria; one test per criterion titled `AC-<n>: ...`, one story per state. Generated components, stories and tests are reviewed (`screen-reviewer` agent, then a person) and what was rejected goes in `docs/learning-plan/REVIEW_LOG.md`.
- Dates leave the API as ISO 8601 and are shown only through `shared/utils/format.ts` / `<DateText>` ("Oct 15, 2026"); money is integer cents shown with `formatMoney`.
- Every page has a breadcrumb; nested pages (a route with `meta.parent`) also have Back. Main pages never show Back.
- Every write request carries an `Idempotency-Key`.
- Tests assert behaviour and must fail when the code is removed. Never weaken a test, an arch test, a lint rule, or a contrast pair to get green.
- API changes update backend tests, `docs/openapi.json`, `frontend/src/shared/api/types.ts` and `frontend/e2e/mock-api.ts` together.
- Google Ads / Meta providers are unverified against live accounts; `PROVIDERS_DRIVER=fake` is the default.

## Where the detailed guidance lives
- `.claude/rules/`: short constraints, loaded only when you touch matching files.
- `docs/standards/` (typescript, laravel, html-css, accessibility): the reasoning, patterns and checklists behind the rules. Read the relevant one when designing types, UI or backend code.
- `docs/architecture.md` and `docs/adr/`: the map and the decisions.
- `.claude/skills/`: procedures (`create-vue-component`, `create-pinia-store`, `add-laravel-endpoint`, `screen-from-spec`) and the `design-language` rules. `.claude/agents/`: independent, read-only reviewers, split by stack: `frontend-code-reviewer` (TypeScript, Vue 3, Pinia, tests, performance, design language) and `backend-code-reviewer` (PHP, Laravel, Eloquent, API design, Pest), plus `a11y-reviewer` and `screen-reviewer` (front end) and `write-path-guardian` (back end). They do not auto-load rules or skills, so they read the files themselves.
- `docs/learning-plan/`: the Claude learning plan mapped to evidence (`COVERAGE.md`), the review log, the one-page setup summary and the usability check. `plugins/stream-frontend-kit/` is the setup packaged as a plugin (generated; `npm run plugin:build`). `.mcp.json` connects the Playwright MCP.
- Product map: **Accounts** (list and an account page with Campaigns, Launch and Changelog tabs; each account has its own monthly budget), **Campaigns** (a tab per provider, status filter, live and simulated rows, an Approvals tab where requests are approved or rejected from the table, bulk budget change and ad copy), **Changelog**. Launching the playbook's campaigns happens on one account; bulk change and ad copy run on a dev-only mock (`frontend/mock-backend/`, served at `/api/playbooks`) and never touch an ad account.
- MCP servers in `.mcp.json` (pinned, free, approved in `.claude/settings.json`): Playwright (walk screens, draft e2e) and Chrome DevTools (accessibility tree, Lighthouse, traces).
- Hooks (`.claude/settings.json`) do what must always happen: block edits to `.env`/secrets/keys/lockfiles/vendor, block destructive shell commands, format and lint on save, type-check and run the affected tests and the screen check after every front-end edit, regenerate tokens and `docs/openapi.json` when their sources change, run the dependency policy after installs.
