# UX and information design: the reasoning

The rule is `.claude/rules/ux-information-design.md`. This page explains why, and how to test a screen.

## Names worth knowing

- **Information architecture (IA):** deciding what belongs together, in what order, behind which label. A screen that "has everything on it" has not been designed.
- **Progressive disclosure:** show what most people need first, keep detail one click away (tabs, accordions, drill-down). It lowers the cost of the first look without removing capability.
- **Nielsen's 10 heuristics:** visibility of system status, match with the real world, user control, consistency, error prevention, recognition over recall, flexibility, minimalist design, error recovery, help. The review checklist below uses them.
- **Hick's law, Miller's law, Fitts's law, Jakob's law, Gestalt proximity:** fewer simultaneous choices, about 7 chunks of memory, big close targets for frequent actions, familiar patterns, and grouping by distance.
- **Cognitive load** is the sum: every extra block competes for attention.

## Tabs, accordion, wizard: which one

| Content                                     | Use                | Because                                                                  |
| ------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| Peer views of one thing, used one at a time | Tabs               | One decision per moment, state in the URL                                |
| Optional or nested detail inside a view     | Accordion          | The overview stays scannable; summaries keep closed sections informative |
| A sequence with consequences                | Wizard             | Order matters; the last step previews, then one approval                 |
| A long list                                 | Server-paged table | Constant cost per screen                                                 |
| A single blocking question                  | Dialog             | It interrupts, so keep it short                                          |

## Review checklist (ask of every screen)

1. **Purpose in 5 seconds:** title, one sentence, one primary action.
2. **Chunking:** no more than about 7 blocks visible; related things closer to each other than to the rest.
3. **Status:** loading, saved, failed, held, selected: visible and announced.
4. **Control and recovery:** cancel, back, retry, undo where possible; destructive actions confirmed.
5. **Prevention:** impossible choices disabled with the reason, not hidden; inputs validated as they are typed.
6. **Recognition:** counts, current step, active filters visible; labels say the outcome.
7. **Nothing important hidden:** errors, partial failures and locks are visible without opening a panel.
8. **Performance:** only what is on screen is mounted and fetched; lists are paged on the server; controls stay mounted while data refreshes.
9. **Consistency:** the same job uses the same component and wording as elsewhere.
10. **Small screens and keyboard:** 320 px without sideways page scroll; every control reachable and operable; focus never lost.

## How it shows up in Stream

Sandbox: Campaigns | New campaign | Platform guide (tabs); a campaign: Metrics | Structure (tabs) with Campaign, Ad groups and Raw JSON as accordions. Bulk approval: the result and its failures first, then Changes to apply | Held (tabs). Deploy: a wizard with a preview that writes nothing.
