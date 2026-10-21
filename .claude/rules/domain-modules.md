---
paths:
  - "backend/app/Domain/**"
  - "backend/tests/Arch/**"
---

# Domain modules (modular monolith)

Code lives in `backend/app/Domain/<Module>/` (Models, Enums, Jobs, services). Modules and their allowed dependencies (enforced by `tests/Arch/ArchTest.php`):

- `Identity`, `Playbooks` and `Sandbox`: standalone. `Sandbox` is the demo area for simulated campaigns (ADR 0006; the UI shows them as Simulated rows on the Campaigns page, with edit and delete): it must never depend on another module, so it cannot reach a provider.
- `Advertising`: the foundation (accounts, campaigns, provider adapters, `StateDiffer`); depends on no other module.
- `Compliance` -> Advertising. `Changelog` -> Advertising, Identity. `Governance` -> Advertising, Compliance, Changelog, Identity (never Playbooks).
- Domain code never imports `App\Http` (controllers, resources, requests).

**The product rule, made structural:** only the Governance module may use the write side of a provider (`CampaignWriter`, `AdProvider`). Everything else reads through `ProviderManager::reader()` (`CampaignReader`). Do not widen the arch test's allow-list to make code compile; move the code instead.

## Where does a class go?
1. Name the concept (campaign, rulebook, receipt, change request...). The module that owns the concept owns the class.
2. Needed by two modules? It goes in the lower one, in this order: Advertising, Compliance, Changelog, Governance. (`StateDiffer` is in Advertising for this reason.)
3. Writes to a provider? That is Governance, through `GovernedWritePath`. Reads from a provider? Use `ProviderManager::reader()`.
4. Not domain at all (HTTP, requests, resources)? It goes in `app/Http`.
5. Namespace `App\Domain\<Module>\<Models|Enums|Jobs|...>`. Models need `@property` docblocks, `#[UseFactory(...)]` and a factory with `$model`. Do not add cross-module Eloquent relations that point "upward".

## Adding a module
Create `app/Domain/<Module>/`, add it to `DOMAINS` in `tests/Arch/ArchTest.php` with its allowed dependencies (the graph must stay acyclic), document it in `docs/architecture.md`, and write an ADR in `docs/adr/` if it changes who depends on whom. When an arch test fails, the code is in the wrong place or depends the wrong way: move it, or invert the dependency (an interface in the lower module, implemented in the higher one). Never loosen the test.
