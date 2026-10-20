---
name: add-laravel-endpoint
description: Step-by-step procedure to add or change a Laravel API endpoint in this repo (route and role, FormRequest, domain service, API Resource, docs, Pest tests, frontend contract). Use when adding or changing an API route.
---

# Add a Laravel endpoint

Backend is a modular monolith: domain code in `backend/app/Domain/<Module>` (see rule `domain-modules` for where code goes), HTTP in `backend/app/Http` (`Controllers/Api`, `Requests`, `Resources`), routes in `routes/api.php`. Conventions and reasoning: `docs/standards/laravel.md`.

1. **Route** inside the `auth:sanctum` group; add `role:approver,admin` or `role:admin` when restricted.
2. **FormRequest** in `app/Http/Requests` for validation (enums with `in:`, money as integer cents, dates ISO 8601). Controllers do not call `$request->validate` for non-trivial payloads.
3. **Reads**: return an API Resource, never a model; paginate and eager-load.
4. **Writes that reach Google Ads or Meta: never call a provider from a controller.** Submit through `GovernedWritePath::submit` with the `Idempotency-Key` header (required, 422 if missing). New business rules go in `ComplianceEngine` or the domain service, not the controller.
5. **Errors**: throw a `GovernanceException` factory (stable `error` code and HTTP status); add a factory for a new case.
6. **Document**: `#[Group]` on the controller and a docblock whose first line is the summary (`ApiDocsTest` fails otherwise). A hook regenerates `docs/openapi.json` when you save; commit it.
7. **Test** in `backend/tests/Feature` with Pest: unauthenticated (401), wrong role (403), validation (422), happy path, and the governance failure modes that apply (locked field 409, emergency stop 423, idempotency conflict 422). Rule `backend-testing` has the conventions.
8. **Frontend contract**: update `frontend/src/shared/api/types.ts` and `frontend/e2e/mock-api.ts` if the shape changed.
9. Run `cd backend && ./vendor/bin/pest && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse`. If you touched the write path, also ask the `write-path-guardian` agent for an audit.
