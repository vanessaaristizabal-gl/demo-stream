# ADR 0006: A standalone demo sandbox for simulated campaigns

Status: accepted

## Context

Nobody on the team has Google Ads or Meta credentials (and the paid access they need), yet the app has to be demonstrated: creating a campaign on either platform, seeing the structure the platform would hold, and seeing the metrics it reports. The governed write path (ADR 0004) must stay the only way to change a live ad account.

## Decision

- A new module, `App\Domain\Sandbox`, owns simulated campaigns (`sandbox_campaigns`, `sandbox_metrics`). It is **standalone**: an arch test forbids it from depending on any other module, so it cannot reach `CampaignWriter`, `AdProvider` or an `AdAccount`.
- Sandbox campaigns are not rows of `campaigns`, never produce a change request or a changelog entry, and never call a provider. They are labelled as a demo in the UI and the API docs.
- Creation is direct (no approval): there is no live account to protect. It is still idempotent (`Idempotency-Key`; same key and body returns the same campaign, a different body returns 422).
- `PlatformCatalog` and `StructureBuilder` use each platform's own vocabulary: Google Ads (campaign, ad group with keywords, responsive search ad; `metrics.cost_micros`, `bidding_strategy_type`) and Meta (campaign with objective, ad set with targeting, ad with creative; Insights fields such as `spend`, `reach`). Metrics are simulated by `MetricsSimulator`: repeatable for a given campaign id, with a ramp-up, a weekend dip and typical dealership ranges.

## Consequences

- The product rule is untouched: the arch tests that guard the write path still pass without any change to their allow-lists.
- The numbers are plausible, not real. They must never be presented as performance data.
- If a real provider is verified later, the catalog and builder are a ready reference for the field mapping; the sandbox itself can stay as a training and demo area or be removed without touching the core.

## Update: one Campaigns page, full CRUD for simulated campaigns
Showing the sandbox as a separate page duplicated Campaigns for the person using it. The frontend now has a single Campaigns page with one tab per provider and one table that mixes live and simulated rows, told apart by a Source tag. The backend boundary does not change: the Sandbox module stays standalone and the arch tests are untouched.

- Simulated campaigns can be edited (`PATCH /api/sandbox/campaigns/{id}`: partial fields plus status `active` or `paused`; the structure is rebuilt, the external id and the metrics history are kept) and deleted (`DELETE`, metrics included). Both require an `Idempotency-Key`; they are safe to repeat.
- Live campaigns are never edited or deleted directly. Their row action is a change request that goes through approval (ADR 0004), and the UI offers no delete for them.
