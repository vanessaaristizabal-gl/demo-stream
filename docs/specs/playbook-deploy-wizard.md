# Spec: Playbook deploy wizard

Component: features/lab/components/DeployWizard

Modelled on AdVise's guided launch (Playbooks Library to a three-step deploy wizard): pick the brand program whose OEM rulebook is rendered into the playbook, pick the accounts, set the budget cap, pacing and status at write, then review a preview that writes nothing and approve once. Accounts that cannot deploy are held with the reason; every write leaves a receipt in the changelog.

## States

- loading
- error
- accounts
- settings
- review
- receipts

## Acceptance criteria

- AC-1: The wizard shows three steps (Accounts, Settings, Review and deploy) and marks the current one with `aria-current="step"`.
- AC-2: Choosing the Stellantis program shows how many rules are encoded and the source of the rulebook; "No OEM" says no rulebook is applied.
- AC-3: Every account shows its OEM and whether Salesforce has an active budget for it; an account without one says it will hold.
- AC-4: Accounts can be selected one by one or all at once, the count of selected accounts is announced, and "Continue to settings" is disabled while none is selected.
- AC-5: The monthly cap is typed in dollars and stored as integer cents; a cap under $100.00 or with more than two decimals is refused with an explanation and "Build the preview" is disabled.
- AC-6: Pacing and status at write can be changed, and status at write offers "Paused at write (recommended)".
- AC-7: Going to the previous step keeps the selected accounts and settings.
- AC-8: The review step says it is a preview and nothing is written, and shows the preview content given to it.
- AC-9: If the options cannot be loaded, the wizard shows the error message with a "Try again" control that emits `reload`.
- AC-10: While the options load, the wizard shows a loading status message.
- AC-11: After a deploy, receipts list each write with the account, who made it, what, the path (validated, compliance, dry-run, write) and the date.
- AC-12: When the step changes, focus moves to the new step's heading.

## Edge cases

- AC-13: Account names and receipt text from the server are rendered as plain text, never as HTML.
- AC-14: With no receipts the receipts section is not shown.

## Out of scope

Choosing the campaign type (a single type is offered), editing keywords and model ad groups, the Salesforce budget groups themselves (read only), and scheduling.
