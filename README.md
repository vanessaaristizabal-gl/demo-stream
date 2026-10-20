# Stream: campaign operations platform

Backend-heavy platform that governs every change to Google Ads / Meta campaigns for car dealerships.

| | |
|---|---|
| `backend/` | Laravel 13 / PHP 8.4, Sanctum, Scramble (OpenAPI), Pest, Larastan, Pint |
| `frontend/` | Vue 3 + TypeScript, Pinia, Vue Router, own design system (tokens + Reka UI + Lucide), Vitest, Storybook 10, Playwright |
| `.claude/` | Agents, skills and hooks for Claude Code |

## Run it
```bash
cd backend && cp .env.example .env && php artisan key:generate && php artisan migrate --seed && php artisan serve
cd frontend && npm install && npm run dev        # proxies /api to localhost:8000
```
Seeded users (password `password`): `strategist@example.com`, `approver@example.com`, `admin@example.com`.
Run `php artisan queue:work` and `php artisan schedule:work` so approved changes apply and polling/sweeps run (the default queue is `database`).

## What exists
- **Governed write path** (`app/Domain/Governance/WritePath`): idempotent submit, live-state diff, field locks, emergency stop, manufacturer compliance, four-eyes approval or pre-approved policy, dry run, per-field partial-failure handling, receipts in the changelog. Apply is claimed atomically so two workers cannot double-write.
- **Compliance engine**: versioned rulebooks with effective dates; `sweep()` opens and resolves findings across live campaigns (hourly job).
- **Playbook renderer**: strict `{{ dotted.path }}` templates; a missing variable fails instead of shipping a blank.
- **External change polling**: mirrors edits made directly in Google Ads / Meta into the changelog (every 5 min). `CampaignAdopter` adopts a campaign in place, keeping its external ID.
- **Providers**: `FakeProvider` (default, deterministic), `GoogleAdsProvider`, `MetaProvider` (REST, back-off on 429/5xx, validate-only dry runs).
- **UI**: login, campaigns (with creation date), change form with field locks, approvals, changelog, emergency stop with confirmation, breadcrumbs on every page and Back on nested pages, light and dark themes.
- **Demo sandbox** (`app/Domain/Sandbox`, page `/sandbox`): create simulated Google Ads or Meta campaigns, see the structure each platform would hold (campaign, ad groups or ad sets, keywords, targeting, ads) and 30 days of simulated metrics with the platforms' own field names. Standalone: it never reaches a real account (ADR 0006). The seeder also creates demo approvals and changelog entries through the real governed path.
- **Design system** (`frontend/src/design-system`): tokens in `frontend/tokens/tokens.json` generate the CSS variables; contrast is tested for WCAG 2.2 AA in both themes. Components are documented in Storybook.
- **API docs**: Scramble serves Swagger-style docs at `/docs/api` (local) and the contract is committed in `docs/openapi.json`.
- **Free dependencies only**: `npm run licenses` fails on any paid, license-key, seat or private-registry dependency.

## Not done
- The Google and Meta providers have **never run against a real account**. They support only `name` and `status` (plus `daily_budget` on Meta). Verify on test accounts before using the `live` provider driver.
- Not built: Salesforce budget binding and pacing, scheduled policies, bulk and multi-account deploys, full API-parity editing (Performance Max, vehicle listings, catalog), rulebook import, template/rule admin UI, adoption CLI, secrets-manager integration, AI recommendations.
- Authorization is role-based (strategist / approver / admin) with no per-account scoping.
- E2E tests run against a mocked API; there is no browser test against the real Laravel app.

## Test
```bash
cd backend  && ./vendor/bin/pest && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse
cd frontend && npm run typecheck && npm run lint && npm test && npm run e2e && npm run build-storybook
```

## Troubleshooting
- **The UI looks stale after changing a dependency or a token:** stop the Vite dev server, delete `frontend/node_modules/.vite`, and start it again (a stale pre-bundle can keep serving an old package version).
- **Pest prints nothing and exits with 1:** a fatal error at load time (for example a duplicate `use`). Run `php -l` on the changed files or `php -d display_errors=1 artisan tinker`.
- **`npm run licenses` fails:** a dependency is paid, license-keyed, seat-based or comes from a private registry. Remove it; do not edit the allowlist.
