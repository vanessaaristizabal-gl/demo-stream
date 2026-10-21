# Spec: Account summary
Component: features/accounts/components/AccountSummary

Demo spec (ilustrativo, no viene de un ticket). The header of an account page in AdVise: who the account is, its own monthly budget, what was spent today and what is still available, with a pace status.

## States
- loading
- error
- on-pace
- underpacing
- overspending

## Acceptance criteria
- AC-1: It shows the account name as a heading and a pace status tag with text (On pace, Underpacing or Overspending), never colour alone.
- AC-2: It shows the OEM, the tier, the strategist, the internal account code and the Google Ads customer id.
- AC-3: It shows allocated budget (per month), spend today and available spend, formatted as money from integer cents.
- AC-4: Available spend is allocated budget minus month-to-date spend; the component receives it and shows it unchanged.
- AC-5: A progress bar shows month-to-date spend against the allocated budget, exposed as `role="progressbar"` with its current value and an accessible name.
- AC-6: While loading it shows a status message; if it cannot load it shows the error with a "Try again" control that emits `reload`.
- AC-7: A "Run audit" control emits `audit` and is disabled and busy while an audit runs.
- AC-8: Text from the server (names, codes) is rendered as plain text, never as HTML.

## Edge cases
- AC-9: Zero allocated budget shows "No budget allocated" instead of a bar, and never divides by zero.
- AC-10: Spend above the allocation fills the bar completely and says how much it is over.

## Out of scope
Editing the budget (read from Salesforce), the date range, and the tabs below the header.
