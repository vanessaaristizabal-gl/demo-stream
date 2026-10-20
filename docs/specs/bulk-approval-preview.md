# Spec: Bulk approval preview
Component: features/lab/components/BulkApprovalPreview

A strategist raises the daily budget of 300 campaigns by 10%. The screen shows what will change, what is held and why, takes one approval, then reports what the provider actually did: some items succeed, some fail, and the failures can be retried.

## States
- loading
- error
- empty
- ready
- applying
- partial-failure
- success

## Acceptance criteria
- AC-1: The summary shows the total number of items, how many are ready and how many are held.
- AC-2: Every ready item shows its account, the budget before and the budget after, formatted as money.
- AC-3: Every held item is listed with its reason, and held items are not counted in what will be applied.
- AC-4: A single "Approve" control applies the ready items; activating it emits `approve` once.
- AC-5: While applying, "Approve" is disabled and announced as busy, so it cannot be submitted twice.
- AC-6: After a partial failure the screen says how many items were applied and how many failed, and lists each failed item with its account and the reason the provider gave.
- AC-7: A failure caused by the provider rate limit is labelled as such and distinguished from other failures.
- AC-8: "Retry failed" appears only while retryable failures remain, and emits `retry`.
- AC-9: When every item was applied the screen shows a success message and no retry control.
- AC-10: If the preview cannot be loaded, the screen shows the error message with a "Try again" control that emits `reload`.
- AC-11: If there is nothing to preview, the screen shows an empty state and no "Approve" control.
- AC-12: Every control is reachable and operable with the keyboard, and the result summary receives focus when applying finishes.

## Edge cases
- AC-13: If the apply request itself fails (for example HTTP 429), the screen shows that message and "Approve" stays available.
- AC-14: A preview in which every item is held shows the held list and disables "Approve".
- AC-15: Server text (reasons, account names) is rendered as plain text, never as HTML.

- AC-16: Once a result exists, "Approve" is no longer offered (one approval per batch); only "Retry failed" remains, and an item never appears twice in the failed list.
- AC-17: If the server reports fewer items than were ready (neither applied nor failed), the result says how many are unaccounted for and never shows plain success.
- AC-18: If the apply request itself fails, focus moves to the error message instead of being lost.

## Out of scope
Selecting a subset of items, editing the new values, undo, scheduling, and approving across several users.
