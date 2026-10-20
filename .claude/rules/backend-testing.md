---
paths:
  - "backend/tests/**"
---

# Backend testing (Pest)

- Pest 4 with `RefreshDatabase`; helpers in `tests/Support.php`; `FakeProvider` is a container singleton that scripts provider behaviour. Never call real Google Ads or Meta from a test.
- Test behaviour that matters: idempotency, four-eyes approval, compliance at submit AND at apply, partial failure, emergency stop, locks, receipts. A new branch in the write path needs a test that fails if the branch is removed (break it on purpose once to prove it).
- Prove a new test bites: break the code under test on purpose (or revert the fix), watch it fail, restore. Never weaken an assertion to get green.
- Architecture tests (`tests/Arch`) are part of the normal suite. If one fails, the code is in the wrong place; do not loosen the test.
- Pest can exit silently on a fatal at load time (for example a duplicate `use`). If a run prints nothing, run `php -d display_errors=1 artisan tinker --execute=...` or `php -l` on the changed files.
- Run `./vendor/bin/pest`, `./vendor/bin/pint --test`, `./vendor/bin/phpstan analyse` and report the exact results.
