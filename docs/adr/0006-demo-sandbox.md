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
