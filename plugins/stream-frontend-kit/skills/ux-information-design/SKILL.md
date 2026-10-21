---
name: ux-information-design
description: UX and information design for screens: when to use tabs, accordions or a wizard, navigation and URL state, never hiding errors, performance of what is mounted, consistency. Load before designing or reviewing how a page is organised.
---

# UX and information design (navigation, density, performance)

The discipline is **information architecture** plus **progressive disclosure**, judged with **Nielsen's 10 usability heuristics**. The laws behind the rules: **Hick** (more choices at once, slower decisions), **Miller** (people hold about 7 chunks), **Gestalt proximity** (what sits together reads as one thing), **Jakob** (use the patterns people already know). Reasoning and examples: `docs/standards/ux.md`.

**One page, one job; one section, one task.** If a page mixes more than two jobs (browse, create, learn), or shows more than about 7 blocks at once, it is organised, not stacked. A wall of cards is a defect, not a layout.

**Choose the pattern by what the content is**
- **Tabs** for peer views of the same object that are used one at a time (Campaigns | New campaign | Platform guide; Metrics | Structure). 2 to 5 tabs, noun labels, a count when it helps (`Held 3`), the most used first and open by default. Never use tabs for steps in a sequence.
- **Accordion** for optional or hierarchical detail inside a view (one section per platform, ad group, raw payload). Open the one people need first; summary text beside the title (`Ad group: Camry · 2 ads`) so closed sections still inform.
- **Wizard** (numbered steps, current step marked, Previous step, state kept) for sequential, high-stakes tasks such as deploys. The last step is a preview that writes nothing, then one approval.
- **Table with server paging, filters and sort** for lists beyond a screen. **Detail page** for one object. **Dialog** only for a short, blocking decision (confirmation), never for browsing.
- A primary action is unique per view and looks different from secondary ones; destructive actions are confirmed and never next to the primary.

**Navigation**
- Every page has a breadcrumb; nested pages also have Back; main pages never do. The tab lives in the URL (`useTabQuery`): it can be linked, reloaded and reached with the browser's Back, and an unknown value falls back to the default.
- Keep the person's place: switching tabs, filters or pages must not lose typed text, selection or scroll of what they left; going back to a step keeps its state.
- Recognition over recall: labels say what happens (`Approve 285 changes`, not `Submit`); show the current state (selected step, active tab, applied filters, counts of selected rows).

**Never hide what matters**
- Errors, partial failures, held items and locks are never inside a closed panel or an inactive tab without a visible signal: show a count or status in the label, or open the panel automatically, and move focus to the message when it appears.
- Empty, loading, error and partial-failure states exist for every tab and section, each with a way forward (retry, clear filters, next step).

**Performance is part of the experience**
- Inactive tabs and closed sections do not mount their content (`DsTabs`, `DsAccordion` already do this); do not fetch for a tab until it is opened unless the count in its label needs it.
- The server pages, filters and sorts anything that can exceed about 100 rows; the browser holds one page. Debounce typing (about 250 ms) before querying and ignore late answers to older queries.
- On refresh keep the controls mounted (mark the region busy) instead of replacing them with a spinner: it keeps focus and avoids layout jumps. Reserve space for async content; do not reflow what the person is reading.
- Prefer the first meaningful content fast: summary and the most used tab first, heavy detail (raw JSON, long tables) behind a click.

**Consistency (Jakob and Nielsen #4)**
- Reuse a base component (`DsTabs`, `DsAccordion`, `DsTable`, `DsMessage`) before inventing one; the same job looks the same on every page. Spacing, grouping and type come from tokens: grouping by proximity (small gaps inside a group, larger between groups), not by extra borders everywhere.
- Reading order follows the task: title and status first, the key numbers next, actions near what they affect (F-pattern on dense screens, Z-pattern on sparse ones).

**Touch and small screens**: targets at least `--ds-size-target-min`; tab lists scroll sideways inside their own box, never the page; the layout works at 320 px.

**Check before you finish:** can a first-time user say what this page is for in 5 seconds, find the primary action without scrolling, and see every error or held item without opening anything? If not, reorganise before adding more.
