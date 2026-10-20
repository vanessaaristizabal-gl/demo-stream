---
paths:
  - "frontend/src/**"
  - "backend/app/Http/Resources/**"
  - "backend/app/Domain/**/Models/**"
---

# Dates, money and display formats

**API and database:** timestamps are stored in UTC and leave the API as ISO 8601 with an offset (`2026-10-15T16:07:03+00:00`, Carbon `toIso8601String()`). Money is integer cents. Never send pre-formatted dates or money from the API. A new date field goes in its Resource, in the model `@property` docblock, and in `docs/openapi.json` (`php artisan scramble:export`).

**UI:** one module decides how data looks, `frontend/src/shared/utils/format.ts`:
- date: `formatDate` gives "Oct 15, 2026"; date and time: `formatDateTime` gives "Oct 15, 2026, 4:07 PM"; unambiguous: `formatDateTimeLong` (tooltips); money: `formatMoney` gives "$100.00"; missing or invalid values show an em dash, never "Invalid Date".
- Render dates with `<DateText :value="iso" />` (`shared/components`), which outputs a semantic `<time datetime>` with a full time-zone tooltip. Sort date columns with `dateSortKey`.
- Locale is fixed `en-US` (US client); time zone is the viewer's.
- Never call `toLocaleDateString`, `toLocaleTimeString`, `toLocaleString` or build `Intl.DateTimeFormat`/`NumberFormat` in components: ESLint fails the edit (and a hook reports it right after you save).
- A new displayed value type (percent, duration, ...) is added to `format.ts` with a spec, not inline.

The semantics of `<time>` and the rest of the accessibility checklist: `docs/standards/accessibility.md`.
