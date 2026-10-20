# Laravel standards (backend)

The short, always-on constraints are in `.claude/rules/laravel-php.md`; module boundaries in `.claude/rules/domain-modules.md`; API contract in `.claude/rules/api-docs.md`. This page has the reasoning and patterns.

## Request flow
`route (+role middleware) -> FormRequest (validate) -> controller (thin) -> domain service -> API Resource`.
- Validation and defaults live in the FormRequest (`rules()`, helpers like `idempotencyKey()`).
- Authorization twice for sensitive actions: route middleware for the coarse role, the service for the rule (for example "approver differs from requester"). Never trust the route alone.
- Return Resources, never models: they fix the public shape and drive the OpenAPI docs.

## Domain code
- Services are plain classes with constructor injection; one public verb per use case (`submit`, `approve`, `apply`).
- Guard first, then act: emergency stop, locks, state transitions, then the write. Fail with a `GovernanceException` factory (stable code and status), never a bare `abort()` with prose.
- State machines: transitions are conditional updates (`->where('status', X)->update(...)`) and check the affected row count; that is what makes double approval or double apply impossible.
- Idempotency: a unique key column; return the existing record for the same key and body; reject the same key with a different body (422).
- Never hold a DB transaction open across an HTTP call to Google or Meta. Write local state in a transaction after the external result is known; if the call throws, record "outcome unknown" and let the poller reconcile.

## Data
- Integer cents, UTC timestamps, string-backed enums, JSON columns cast to arrays with documented shapes.
- Eager load, paginate, chunk. Add the index in the same migration as the query that needs it.
- Factories set `$model` and models use `#[UseFactory]`, because modules do not follow Laravel's naming guess.

## Queues
- `ShouldQueue` jobs: explicit `$tries`, accept an ID (not a model), reload inside `handle`, safe to run twice.
- Split queues per concern when you scale (`writes`, `polling`, `sweeps`) so a slow provider cannot starve approvals.
- Scheduled work lives in `routes/console.php` with `withoutOverlapping()`.

## Static analysis and style
Pint on save (hook), PHPStan level 5 at zero errors. Fix the type, do not suppress. Model attributes need `@property` docblocks.

## Before you finish
`cd backend && ./vendor/bin/pest && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse`; for API changes also `php artisan scramble:export`.

## API documentation (Scramble)
Tool: Scramble (MIT, `dedoc/scramble`), generated from code: UI at `/docs/api`, JSON at `/docs/api.json`, committed export at `docs/openapi.json` (a hook regenerates it when you save API code; `ApiDocsTest` fails if it is stale or a route has no summary).

```php
#[Group('Governed changes')]            // on the controller class (Dedoc\Scramble\Attributes\Group)
class ChangeRequestController
{
    /**
     * Propose a change to a campaign           <- first line is the summary
     *
     * Requires an `Idempotency-Key` header. The same key and body returns the same change.   <- business rules
     */
    public function store(SubmitChangeRequest $request, Campaign $campaign): JsonResponse
```
Request shape comes from the FormRequest, response shape from the API Resource (`{ data }` or `{ data, links, meta }`); model `@property` docblocks type the fields. Dates are ISO 8601, money is integer cents. The document declares Bearer auth; outside local only admins can open the docs. Next step: generate frontend types from the export with `openapi-typescript` (MIT).
