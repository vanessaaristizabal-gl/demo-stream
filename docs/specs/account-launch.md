# Spec: Launch a playbook on one account
Component: features/accounts/launch/LaunchWizard

On an account's page, the Launch tab creates the playbook's campaigns for THAT account (modelled on AdVise's guided launch). The account's own values are the defaults, so the settings step is a confirmation: they change only when this launch needs something different. A preview that writes nothing comes first, then one approval. Campaigns that cannot go out are held with the reason; every write leaves a receipt in the changelog.

## States
- loading
- error
- playbook
- settings
- no-budget
- review

## Acceptance criteria
- AC-1: The wizard shows three steps (Playbook, Settings, Review and deploy) and marks the current one with `aria-current="step"`.
- AC-2: Choosing the Stellantis program shows how many rules are encoded and the source of the rulebook; "No OEM" says no rulebook is applied.
- AC-3: The playbook step lists the campaigns the playbook launches, each with its share of the monthly cap.
- AC-4: Campaigns can be picked one by one or all at once, the count is announced, and "Continue to settings" is disabled while none is picked.
- AC-5: The settings step shows the monthly cap, pacing and status at write as inherited values (the cap is the account's own monthly budget); no field is editable until asked.
- AC-6: "Change for this launch" reveals the fields; the cap is typed in dollars and stored as integer cents, and pacing and status at write can be changed.
- AC-7: A cap under $100.00 or with more than two decimals is refused with an explanation and "Build the preview" is disabled.
- AC-8: "Use the account defaults" puts every value back and hides the fields.
- AC-9: An account with no Salesforce budget is warned in the settings step, and the preview can still be built.
- AC-10: Going to the previous step keeps the picked campaigns and the settings.
- AC-11: The review step says it is a preview and nothing is written, and shows the preview content given to it.
- AC-12: If the playbook cannot be loaded, the wizard shows the error with a "Try again" control that emits `reload`; while it loads it shows a status message.
- AC-13: When the step changes, focus moves to the new step's heading.

## Edge cases
- AC-14: Campaign names from the server are rendered as plain text, never as HTML.
- AC-15: The OEM rulebook starts from the account: a Stellantis account gets it, any other account starts with none.

## Out of scope
Launching on several accounts at once (each account is its own launch), editing keywords and ad groups, the Salesforce budgets themselves (read only), and scheduling.
