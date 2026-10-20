# ADR 0005: API contract generated from code (OpenAPI via Scramble)

Status: accepted

## Context
The frontend, the mock API used in e2e tests and the client's engineers all depend on the API shape.

## Decision
FormRequests and API Resources define the shapes; Scramble (MIT) generates OpenAPI 3.1 and a Swagger-style UI at `/docs/api`. The export is committed as `docs/openapi.json`; a test fails if it is stale or any route lacks a summary. Dates are ISO 8601 with an offset, money is integer cents, single resources are `{ data }`.

## Consequences
Docs cannot drift from the code. Next step: generate frontend types from the export.
