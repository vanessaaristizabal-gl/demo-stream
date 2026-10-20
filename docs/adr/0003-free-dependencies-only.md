# ADR 0003: Free dependencies only

Status: accepted

## Context
The client will not pay licenses, seats, subscriptions or tokens to maintain the platform. Some UI libraries turn out to need a license key or show a notice without one, and that is only discovered after adopting them.

## Decision
Only permissive licenses (MIT, ISC, Apache-2.0, BSD, 0BSD, BlueOak, CC0, OFL for fonts); MPL-2.0 only for unshipped dev tools. No license keys, accounts, tokens or private registries. `frontend/tools/check-licenses.mjs` checks the npm and composer trees, bans known commercial packages by name, and flags private registries and credentials. It runs in `npm run check` and as a hook after installs.

## Consequences
Fewer convenient components; every new dependency must clear the policy, and the allowlist is a decision for the user, not something to edit to make a package pass.
