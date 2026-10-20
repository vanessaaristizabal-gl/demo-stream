# Spec: Dense campaign list (2,000 rows)
Component: features/lab/components/DenseList

An operator scans, filters and sorts 2,000 campaigns and fixes one budget inline. The server does the filtering, sorting and paging; the browser only ever holds one page.

## States
- loading
- error
- empty
- ready
- saving
- locked
- rate-limited

## Acceptance criteria
- AC-1: The list shows one page of rows (at most 50), with the total number of matching rows.
- AC-2: Changing the status filter or the search text emits `query` with that filter and page 1.
- AC-3: Activating a sortable column header emits `query` with the sort key and direction, and the header exposes its state with `aria-sort`.
- AC-4: Each row shows its status as a text badge, not only as a colour.
- AC-5: Changing page emits `query` with the new page.
- AC-6: Editing a budget and confirming emits `save` with the row id and the new amount in integer cents.
- AC-7: While a row is saving its control is disabled and busy.
- AC-8: When the server rejects the edit because the field is locked, the reason is shown next to the row and the old budget stays.
- AC-9: When the server answers with a rate limit, the screen says to retry and for how long.
- AC-10: When no row matches the filters, the screen says so and offers to clear them.
- AC-11: If the list cannot be loaded, the screen shows the error with a "Try again" control that emits `reload`.
- AC-12: The edit control is reachable by keyboard; Enter saves, Escape cancels and returns focus to the edit button.

## Edge cases
- AC-13: An invalid amount (empty, zero, negative, more than two decimals) is refused before any request and explained.
- AC-14: The component never receives more than one page, and the table is never rendered with more than 100 rows.

- AC-15: While a new filter, sort or page loads, the search box and the table stay in place (marked busy), so keyboard focus is not lost.
- AC-16: After a rejected save the editor stays open and focus returns to its field.
- AC-17: Changing the status filter while a search is still pending sends the typed search text with it.

## Out of scope
Bulk editing, column chooser, export, and virtual scrolling (the page size keeps the DOM small instead).
