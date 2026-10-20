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
- Frontend (`cd frontend`): `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run tokens`, `npm run licenses`, `npm run storybook`, `npm run e2e`, `npm run check`

## Non-negotiables
- **Dependencies must be free**: no paid licenses, license keys, seats, accounts, tokens, subscriptions or private registries. `npm run licenses` checks frontend and backend; a hook runs it after installs. Ask before adding any dependency outside the allowlist, and never edit the allowlist to make a package pass.
- UI: WCAG 2.2 AA, responsive down to 320 px, Lucide icons only, no emojis, light and dark themes.
- Dates leave the API as ISO 8601 and are shown only through `shared/utils/format.ts` / `<DateText>` ("Oct 15, 2026"); money is integer cents shown with `formatMoney`.
- Every page has a breadcrumb; nested pages (a route with `meta.parent`) also have Back. Main pages never show Back.
- Every write request carries an `Idempotency-Key`.
- Tests assert behaviour and must fail when the code is removed. Never weaken a test, an arch test, a lint rule, or a contrast pair to get green.
- API changes update backend tests, `docs/openapi.json`, `frontend/src/shared/api/types.ts` and `frontend/e2e/mock-api.ts` together.
- Google Ads / Meta providers are unverified against live accounts; `PROVIDERS_DRIVER=fake` is the default.

## Where the detailed guidance lives
- `.Codex/rules/`: short constraints, loaded only when you touch matching files.
- `docs/standards/` (typescript, laravel, html-css, accessibility): the reasoning, patterns and checklists behind the rules. Read the relevant one when designing types, UI or backend code.
- `docs/architecture.md` and `docs/adr/`: the map and the decisions.
- `.Codex/skills/`: procedures (`create-vue-component`, `create-pinia-store`, `add-laravel-endpoint`). `.Codex/agents/`: independent reviewers (`code-reviewer`, `a11y-reviewer`, `write-path-guardian`); they do not auto-load rules or skills, so they read the files themselves.
- Hooks (`.Codex/settings.json`) do what must always happen: block edits to `.env`/lockfiles/vendor, block destructive shell commands, format and lint on save, regenerate tokens and `docs/openapi.json` when their sources change, run the dependency policy after installs.
