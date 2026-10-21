# Architecture

## What we use today

**Backend: a modular monolith** (Laravel 13), organised by bounded context rather than by technical layer.

```
app/Domain/
  Identity     users, roles                                   standalone
  Playbooks    template renderer                              standalone
  Sandbox      simulated Google Ads / Meta campaigns for demos  standalone (no providers, no real accounts)
  Advertising  accounts, campaigns, provider adapters,        the foundation (depends on nothing)
               StateDiffer
  Compliance   rulebooks, engine, sweeps                      -> Advertising
  Changelog    receipts, external-change poller               -> Advertising, Identity
  Governance   change requests, policies, emergency stop,     -> Advertising, Compliance, Changelog, Identity
               GovernedWritePath, ApplyChangeRequest job
app/Http       controllers, FormRequests, API Resources       calls the domain; the domain never calls it
```

- Ports and adapters at the edge: `CampaignReader` / `CampaignWriter` are the ports, `GoogleAdsProvider`, `MetaProvider` and `FakeProvider` the adapters.
- The product rule "every write goes through the governed path" is **structural**: only Governance may depend on `CampaignWriter`. `backend/tests/Arch` fails the build otherwise, and the same tests keep the module graph acyclic.
- API contract: FormRequests and API Resources are the single source for request and response shapes; Scramble turns them into OpenAPI (`/docs/api`, committed as `docs/openapi.json`, checked for staleness by a test).
- Jobs on the database queue (SQS in production, per the JD); the poller and compliance sweep are scheduled with `withoutOverlapping`.

**Frontend: feature modules over a design system.**

```
src/design-system  tokens + Ds* components (Reka UI primitives, Lucide icons)   depends on nothing
src/shared         api client and types, formatters, composables                depends on nothing
src/features/*     auth, accounts, campaigns (incl. approvals, simulated, bulk, copy), changelog, system: store, components, views
src/app            shell, router, layout: the only place features are composed
```

ESLint enforces the arrows (design-system and shared never import features; features never import each other, identity excepted; everything reaches the design system through its barrel). Design tokens (`frontend/tokens/tokens.json`) generate the CSS variables; tests check WCAG 2.2 contrast in both themes, forbid raw hex, and forbid components from using primitive tokens.

## Should we use microservices?

**No, not now.** The reasons are specific to this project, not general taste:

1. **A small senior team on a fixed date** (about eight people, two backend seats). Microservices trade code complexity for operational complexity (deployments, versioning of contracts, tracing, per-service pipelines). That cost lands on the team that is also doing the migration.
2. **The core needs transactional consistency.** Approval, the provider write, the receipt and the live-state update must agree. A distributed version needs sagas, outbox and compensations to get what one database transaction gives us.
3. **The load is modest.** About 1,600 accounts, polled every five minutes, is a few requests per second. The real constraint is the providers' rate limits, which a service split does not remove.
4. **The client team will own it.** They work in Laravel. One deployable they can read end to end beats a mesh they have to learn.

What gives the benefits people want from microservices, without the cost: strict module boundaries (done, and tested), separate queues and workers per concern, and extractable seams.

## Where to take it next (in order of value)

1. **Provider gateway with per-account rate limiting.** A token bucket per provider and per account (Redis), honouring `Retry-After` and quota headers, in front of the adapters. This is where API capacity tuning lives, and it is the first thing that could become a separate service if the load ever demanded it.
2. **Split workers by queue**: `writes` (approved changes), `polling`, `sweeps`, each with its own concurrency so a slow Meta account cannot starve approvals.
3. **Outbox and domain events** for what is not part of the atomic write: notifications, Salesforce sync, metrics. Governance emits `ChangeApplied`; consumers react asynchronously. Keeps modules decoupled and gives AI recommendations a safe place to listen later.
4. **Production data layer**: PostgreSQL or MySQL instead of SQLite; partition or archive `changelog_entries` (append-only, grows with 1,600 accounts); a read model for the changelog screen if queries get heavy.
5. **Contract-first frontend**: generate TypeScript types from `docs/openapi.json` (openapi-typescript, MIT) so the contract cannot drift; add Pact-style or schema tests against the mock API.
6. **Observability**: structured logs with change-request id and idempotency key as correlation ids, metrics on provider latency, error and rate-limit hits, alerts on `outcome_unknown` writes and on the poller falling behind.
7. **Security**: per-account authorization scoping, credentials from AWS Secrets Manager with least privilege, audit of emergency-stop use.
8. **AI recommendations, later**: a separate process (it has a different runtime, cost and failure profile) that only ever *proposes* changes through the same governed path. It needs no special write access, which is what makes it safe.

## Decisions
See `docs/adr/`.
