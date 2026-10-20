# Stream: Project Guide

Stream is a campaign operations platform for a large automotive marketing agency. It manages paid search and paid social campaigns (Google Ads and Meta) for car dealerships. The product is built around one rule: **every change to a live ad account goes through a single governed write path**.

This guide explains what the project does, how to run it, how to verify it, and how to use the Claude Code tooling in `.claude/` (agents, skills, hooks, rules). It was verified on 2026-10-19 on macOS (PHP 8.4, Node 26, npm 11).

---

## 1. What the product does

A strategist asks for a change (for example, "raise this campaign's daily budget"). The platform does not write it straight away:

1. **Resolve** the change against the _live_ state of the ad account (a fresh read, not a cached copy).
2. **Check compliance** against the manufacturer rulebooks (versioned, with effective dates).
3. **Approve**: a different person (four-eyes) or a pre-approved policy.
4. **Dry run**: validate with the provider without writing.
5. **Write** through the provider API, idempotently (a reused idempotency key with different content is rejected).
6. **Receipt**: a changelog entry records who acted, who approved, old and new values.

Other pieces: field-level locks, an emergency stop that blocks all writes, a playbook renderer (strict `{{ dotted.path }}` templates; a missing variable fails instead of shipping a blank), a compliance sweep (hourly), and a poller (every 5 minutes) that mirrors edits made directly in Google Ads or Meta into the changelog.

**Providers are fake by default.** `PROVIDERS_DRIVER=fake` is deterministic and needs no accounts. The Google Ads and Meta adapters have never run against a real account.

### Roles (seeded users, password `password`)

| User                   | Role       | Can                                                |
| ---------------------- | ---------- | -------------------------------------------------- |
| strategist@example.com | strategist | request changes                                    |
| approver@example.com   | approver   | approve/reject (not their own requests)            |
| admin@example.com      | admin      | everything, plus emergency stop, rulebooks, sweeps |

### Campaigns: live and simulated, one page (no API keys needed)

The **Campaigns** page (`/campaigns`) has one tab per provider (Google Ads, Meta Ads; the tab is in the URL). Each tab holds one table with every campaign of that provider, with a **Source** column:

- **Live** campaigns are read from the provider and change only through the governed write path: the row action is *Request a change* and opens a change request that needs approval. They cannot be deleted from the table.
- **Simulated** campaigns (the demo sandbox, no credentials or paid APIs) have the full CRUD: *New simulated campaign* (a nested page with a form: platform, goal, daily budget, vehicle, city, landing page), *Edit* (the campaign's Settings tab, direct), *Delete* (after a confirmation). They never reach a real account and do not go through the governed write path (ADR 0006).
- A simulated campaign's page has tabs: **Metrics** (30 days simulated, native API field on each tile, daily spend chart and table), **Structure** (Google Ads: campaign, ad groups with keywords, responsive search ad; Meta: campaign with objective, ad sets with targeting, ad with creative; collapsible sections and a "Raw JSON payload") and **Settings** (edit).
- Under each table, a folded "What <provider> collects" lists the metrics, their API field names and units.
- API: `GET /api/sandbox/catalog`, `GET|POST /api/sandbox/campaigns`, `GET|PATCH|DELETE /api/sandbox/campaigns/{id}`. Every write carries an `Idempotency-Key`. Old `/sandbox` links redirect to Campaigns.

### Seeded demo activity

`php artisan migrate --seed` also creates, through the real governed write path: a change applied by a pre-approved policy, one approved by the approver, one rejected, one blocked by the Toyota rulebook, two waiting for approval, and two edits "made directly in the provider" mirrored into the changelog. So **Approvals** and **Changelog** are never empty. To add it to an existing database run `php artisan db:seed --class=DemoActivitySeeder` (it does nothing if the demo data already exists).

---

## 2. Architecture

```
stream/
  backend/    Laravel 13, PHP 8.4, Sanctum, Scramble (OpenAPI), Pest, Larastan, Pint
  frontend/   Vue 3 + TypeScript, Pinia, Vue Router, own design system, Vitest, Storybook 10, Playwright
  docs/       architecture.md, adr/ (decisions), standards/ (reasoning + checklists), openapi.json
  .claude/    Claude Code: agents, skills, hooks, rules, settings.json
  .codex/ .agents/  mirror of .claude/ for the Codex CLI (see section 8)
```

### Backend: modular monolith (`backend/app/Domain/`)

| Module      | Responsibility                                                              | Depends on            |
| ----------- | --------------------------------------------------------------------------- | --------------------- |
| Advertising | accounts, campaigns, provider adapters, StateDiffer                         | nothing               |
| Identity    | users, roles                                                                | nothing               |
| Playbooks   | template renderer                                                           | nothing               |
| Sandbox     | simulated Google Ads / Meta campaigns for demos (own tables, no providers)  | nothing               |
| Compliance  | rulebooks, engine, sweeps                                                   | Advertising           |
| Changelog   | receipts, external-change poller                                            | Advertising, Identity |
| Governance  | change requests, policies, emergency stop, **GovernedWritePath**, apply job | all of the above      |

Controllers are thin; FormRequests validate input; API Resources shape output. Ports and adapters at the edge: `CampaignReader` / `CampaignWriter` are the ports; `GoogleAdsProvider`, `MetaProvider`, `FakeProvider` are the adapters. **Only Governance may use the write side**, and `backend/tests/Arch` fails the build otherwise. That is how "no second write path" is enforced structurally, not by convention.

### Frontend: features over a design system (`frontend/src/`)

- `design-system/`: tokens + `Ds*` components (Reka UI primitives, Lucide icons, no UI kit).
- `shared/`: API client and types, formatters (`format.ts`, `<DateText>`), composables.
- `features/<name>/`: auth, campaigns, approvals, changelog, system (store, components, views).
- `app/`: shell, router, layout; the only place features are composed.

ESLint enforces the dependency arrows. Design tokens live in `frontend/tokens/tokens.json` and generate the CSS variables (`npm run tokens`, run automatically before dev/build/storybook).

### Non-negotiables (from CLAUDE.md)

Free dependencies only; WCAG 2.2 AA, responsive to 320 px, light and dark themes, Lucide icons, no emojis; dates ISO 8601 from the API and shown only via `format.ts`; money as integer cents; breadcrumb on every page, Back only on nested pages; every write request carries an `Idempotency-Key`; tests must fail when the code is removed; API changes update tests, `docs/openapi.json`, `types.ts` and `e2e/mock-api.ts` together.

---

## 3. Run it locally

Prerequisites: PHP 8.4, Composer, Node 22+ (verified on 26), npm.

```bash
# Backend (terminal 1)
cd backend
cp .env.example .env && php artisan key:generate    # skip if .env exists
php artisan migrate --seed                          # first time only (see note)
php artisan serve                                   # http://localhost:8000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev                                         # http://localhost:5173, proxies /api to :8000

# Storybook (terminal 3, optional)
cd frontend && npm run storybook                    # http://localhost:6006

# Queue and scheduler (terminals 4 and 5, only if QUEUE_CONNECTION=database)
cd backend && php artisan queue:work
cd backend && php artisan schedule:work
```

Notes:

- `--seed` is **not idempotent**: running it twice fails with a unique constraint on `users.email`. To re-seed, delete `backend/database/database.sqlite` and migrate again (do it by hand; the agent hooks block `migrate:fresh`).
- The checked-in `.env` uses `QUEUE_CONNECTION=sync`, so approved changes apply inline and you do not need `queue:work` locally. README says the default is `database`; with `database` you must run the worker.
- Smoke test the API: `curl -X POST localhost:5173/api/login -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"email":"strategist@example.com","password":"password"}'` returns a token.
- API docs (Scramble): http://localhost:8000/docs/api. The committed contract is `docs/openapi.json`; regenerate with `php artisan scramble:export`.
- Stale UI after a dependency or token change: stop Vite, delete `frontend/node_modules/.vite`, start again.

---

## 4. Verify it works

| What                | Command                                                                      | Result on 2026-10-19                                                           |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Backend tests       | `cd backend && ./vendor/bin/pest`                                            | 78 passed, 332 assertions                                                      |
| Code style          | `./vendor/bin/pint --test`                                                   | passed                                                                         |
| Static analysis     | `./vendor/bin/phpstan analyse --memory-limit=1G`                             | 0 errors (needs the flag: default 128M crashes the parallel workers)           |
| Frontend full check | `cd frontend && npm run check` (typecheck, lint, unit tests, license policy) | 46 files / 344 tests passed; licenses OK (443 frontend + 133 backend packages) |
| End-to-end          | `cd frontend && npm run e2e`                                                 | 64 passed (about 9 s)                                                          |
| Storybook           | `npm run storybook`, `npm run build-storybook`                               | build completes; 77 stories before the sandbox, 89 now (12 are Sandbox)        |

### Playwright (end-to-end), how it works

- Config: `frontend/playwright.config.ts`. Chromium only, locale `en-US`, timezone `UTC` (so formatted dates are identical everywhere), fully parallel, retries and an HTML report in CI.
- `webServer` starts `npm run dev` automatically and reuses a server already running on :5173 (not in CI).
- **The backend is not needed.** Tests run against a mocked API (`frontend/e2e/mock-api.ts`) that intercepts `/api/*` requests. The trade-off: they prove the UI contract, not the real Laravel app. If you change an API shape, update the mock too.
- Specs in `frontend/e2e/`: `auth`, `navigation` (breadcrumbs, Back rules, skip link, safe redirects, 404 inside the shell), `change-flow`, `approvals`, `changelog`, `emergency-stop` (confirm dialog, focus return, per-role visibility), `dates`, and `a11y` (axe scans of the main pages in light and dark themes plus phone viewport).
- Commands: `npm run e2e` (all, headless), `npx playwright test e2e/a11y.spec.ts` (one file), `npm run e2e:ui` (interactive UI mode with time-travel debugging), `npx playwright show-report` (after a CI-style run).

### Storybook, how it works

- Config in `frontend/.storybook/` (`main.ts`: stories from `src/**/*.stories.ts`, addons docs + a11y; `preview.ts`: theme toolbar).
- Every `Ds*` component and shared component has stories per visual state and a `play` function for interactions. The **a11y panel** runs axe on each story. Use the toolbar to switch light/dark.
- `npm run build-storybook` produces a static site and fails on broken stories.

---

## 5. Claude Code tooling in `.claude/`

Claude Code reads `.claude/` automatically when you open the repo (`claude` in the project root, or the VS Code extension). Nothing needs to be installed.

### 5.1 Agents (`.claude/agents/*.md`)

Independent, **read-only** reviewers that run in their own context with a restricted tool set (Read, Glob, Grep, Bash). They cannot edit code. They do not auto-load rules or skills, so each one reads the files it needs.

| Agent                 | Use it when                                                                             | Verified                                                          |
| --------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `code-reviewer`       | a feature or fix is finished, before calling it done; returns ranked findings           | Ran on the Compliance module and seeder; returned ranked findings |
| `a11y-reviewer`       | after any UI change, or when an axe/Storybook a11y check fails; runs `e2e/a11y.spec.ts` | Ran on `DsConfirmDialog`; e2e a11y 18/18 passed; 2 low findings   |
| `write-path-guardian` | any change touching providers, jobs, change requests, rulebooks or the changelog        | Audited the whole write path; all invariants passed               |

How to use: ask in natural language ("use the a11y-reviewer on the new dialog"), or let Claude delegate automatically based on each agent's `description`. List them with `/agents`.

### 5.2 Skills (`.claude/skills/*/SKILL.md`)

Step-by-step procedures Claude loads when the task matches the `description`, or when you type the slash command.

| Skill                  | Invoke                  | What it does                                                                                                                                                                                |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-vue-component` | `/create-vue-component` | Picks the layer (`--ds`, `--feature <name>`, `--shared`), runs `scripts/new-component.mjs` to create `.vue`, `.spec.ts`, `.stories.ts` (and the barrel export for `--ds`), then a checklist |
| `create-pinia-store`   | `/create-pinia-store`   | Setup-style typed store plus a Vitest spec that mocks the API client                                                                                                                        |
| `add-laravel-endpoint` | `/add-laravel-endpoint` | Route and role, FormRequest, domain service, API Resource, OpenAPI export, Pest tests, frontend contract                                                                                    |

Verified: the scaffold script creates all three files, adds the export, refuses to overwrite on a second run, and the generated spec, lint and typecheck pass.

### 5.3 Hooks (`.claude/settings.json` + `.claude/hooks/*.mjs`)

Hooks are scripts the **harness** runs on tool events, so they always happen (unlike instructions, which the model may forget). Exit code 2 blocks the action and shows the message to Claude.

| Event                  | Hook              | Behaviour                                                                                                                                         |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| PreToolUse Edit/Write  | `guard-files.mjs` | Blocks edits to `.env`, lockfiles, `vendor/`                                                                                                      |
| PreToolUse Bash        | `guard-bash.mjs`  | Blocks `migrate:fresh/reset`, `db:wipe`, force-push, `--no-verify`, `rm -rf /` or `~`, `PROVIDERS_DRIVER=live`                                    |
| PostToolUse Edit/Write | `format.mjs`      | Prettier + ESLint on frontend files, Pint on PHP; regenerates tokens and `docs/openapi.json` when their sources change (`lib/sync-generated.mjs`) |
| PostToolUse Bash       | `check-deps.mjs`  | After `npm/composer install/require/update/remove`, runs the license policy                                                                       |

Verified by feeding each hook sample payloads: all protected paths and dangerous commands exit 2 with a clear message, normal ones exit 0. (The bash hook also blocked a test command during this verification, which shows it is live.)

### 5.4 Rules (`.claude/rules/*.md`)

Short constraints (api-docs, css, dates-and-formats, domain-modules, laravel-php, ui-library, backend-testing, frontend-testing, html-accessibility, typescript). They load only when you touch matching files. The longer reasoning is in `docs/standards/`.

### 5.5 Memory

Claude Code also keeps personal notes outside the repo (`~/.claude/projects/.../memory/`): the dependency policy and UI preferences. They are not part of the project.

---

## 6. Are all of them necessary?

| Item                                         | Verdict                            | Why                                                                                                |
| -------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `write-path-guardian`                        | Keep, essential                    | Guards the one product rule; mirrors the arch test but also reads for idempotency, locks, receipts |
| `a11y-reviewer`                              | Keep                               | WCAG 2.2 AA is a non-negotiable and axe cannot see focus lifecycle                                 |
| `code-reviewer`                              | Keep, lowest value                 | Overlaps the built-in `/code-review` skill; its edge is repo-specific reading order                |
| `create-vue-component`                       | Keep                               | The only skill with a script and real automation                                                   |
| `create-pinia-store`, `add-laravel-endpoint` | Keep, but they are checklists      | Useful as onboarding docs; could live in `docs/standards/` if you want fewer moving parts          |
| Hooks (all four)                             | Keep                               | They enforce what must always happen; all verified                                                 |
| Rules (10)                                   | Keep                               | Small and scoped; no cost unless matched                                                           |
| `.codex/` and `.agents/`                     | Remove if you do not use Codex CLI | A duplicate of `.claude/` that must be kept in sync by hand                                        |

---

## 7. Issues found during verification

1. **PHPStan fails with the default memory limit** (128M, worker crash). Use `--memory-limit=1G`, or set it in `phpstan.neon`/the script.
2. **`php artisan migrate --seed` is not idempotent** (unique violation on a second run).
3. **`QUEUE_CONNECTION=sync` in `.env` vs `database` in the README**; clarify which one local development should use.
4. **Codex mirror paths:** `AGENTS.md` and `.agents/skills/create-vue-component/SKILL.md` refer to `.Codex/...`, but the real directory is `.codex/` (and the skill script lives under `.agents/`). It breaks on case-sensitive filesystems.
5. Review findings (read-only, not fixed), from the agents:
   - Compliance sweep can create duplicate findings under concurrent sweeps (no unique key, job not unique); an invalid rule shape aborts the whole sweep; `max`/`min` use loose comparison.
   - The provider write happens before the receipt transaction, so a failure between them leaves a write without a receipt (design risk; `outcome_unknown` handling exists for exceptions).
   - `DsConfirmDialog`: error message mounted with `v-if` may not be announced; Cancel is disabled while loading (focus can be lost); no error-state story.
6. `docs/architecture.md` lists the next steps (provider gateway with rate limiting, split queues, outbox, production database, contract-first types, observability, secrets, AI as a separate proposer process).

---

## 8. Daily workflow cheat sheet

```bash
cd backend  && ./vendor/bin/pest && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --memory-limit=1G
cd frontend && npm run check && npm run e2e && npm run build-storybook
```

Start a feature: describe it to Claude, who loads the matching skill and rules; hooks format and lint every save; finish with the relevant reviewer agent (`code-reviewer` always, `a11y-reviewer` for UI, `write-path-guardian` for backend writes).
