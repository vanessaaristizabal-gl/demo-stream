---
paths:
  - "backend/**/*.php"
---

# PHP and Laravel rules (backend)

- PHP 8.4, Laravel 13. `./vendor/bin/pint` formats (a hook runs it on save); `./vendor/bin/phpstan analyse` (Larastan, level 5) stays at 0 errors, with no baseline and no `@phpstan-ignore`.
- Type everything: parameter, return and property types; `@property` docblocks on models (the attribute-style models need them for static analysis); generics on relations (`@return BelongsTo<Campaign, $this>`).
- Thin controllers: validate with a FormRequest, authorize by role middleware AND in the service for sensitive actions, delegate to a domain service, return an API Resource. No business logic, no query building beyond simple reads.
- Money is integer cents, never float. Timestamps are UTC, serialized ISO 8601 (see `dates-and-formats`).
- Queries: eager load (`with`), bound every list (`paginate`, `chunkById`), index what you filter on, use unique constraints for idempotency. No N+1.
- Jobs: idempotent, explicit `$tries`, safe on double dispatch, no external I/O inside a DB transaction. Claim work with a conditional `UPDATE ... WHERE status = ...`, not read-then-write.
- Enums are string-backed and live in their module. Use `Relation::enforceMorphMap` aliases, never class names in the database.
- Never reset a database from a change: a hook blocks the destructive commands. Seeders for demo data are idempotent (they add what is missing), so they can run on an existing database (`php artisan db:seed --class=DemoAccountsSeeder`).
- Write endpoints (POST, PATCH, DELETE) require an `Idempotency-Key`; PATCH takes only the fields to change, DELETE answers 204.
- Secrets only from env through `config/*.php`; never in code, logs, fixtures or API responses.

Reasoning and patterns (request flow, state machines, idempotency, queues, API documentation): `docs/standards/laravel.md`.
