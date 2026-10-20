# ADR 0001: Modular monolith, not microservices

Status: accepted

## Context
Platform for governed changes to about 1,600 ad accounts. Small senior team, fixed date, Laravel team takes over after handover. Core flow needs atomic consistency between approval, provider write, receipt and live state.

## Decision
One Laravel application organised in domain modules under `app/Domain` (Identity, Advertising, Compliance, Governance, Changelog, Playbooks). Dependencies point one way and are enforced by Pest architecture tests. Scale by splitting queues and workers, not by splitting the codebase.

## Consequences
- Simple deployment and debugging; transactions where we need them.
- Boundaries are real because tests enforce them; a module can later be extracted by replacing calls with a client behind the same interface.
- We accept one shared database and one release train. Revisit if a part needs an independent scaling or release profile (the provider gateway is the first candidate).
