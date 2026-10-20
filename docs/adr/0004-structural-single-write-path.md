# ADR 0004: Make the single write path structural

Status: accepted

## Context
"Every production write goes through the governed path, no exceptions, including for us" is the central rule of the platform. A convention is easy to break by accident.

## Decision
Split the provider contract into `CampaignReader` (fetch) and `CampaignWriter` (validate, mutate). `ProviderManager::reader()` is what everything else gets. Only the Governance module may depend on `CampaignWriter` or `AdProvider`; an architecture test fails otherwise. Inside Governance, `GovernedWritePath` claims each approved change atomically, re-resolves live state and re-checks compliance and the emergency stop at apply time, dry-runs, writes, and records receipts in the same transaction as the live-state update.

## Consequences
A new feature that "just needs to update a budget" cannot compile into a bypass without changing a test that explains why not.
