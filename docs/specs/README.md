# Screen specs

A spec is the input of the `screen-from-spec` skill and of the `screen-reviewer` agent. It is written by a person before any code is generated.

Format (the traceability check, `npm run traceability` in `frontend/`, parses it):

```
# Spec: <name>
Component: <path under frontend/src, without extension>
## States            one bullet per state; each needs a Storybook story named in PascalCase (partial-failure -> PartialFailure)
- loading
## Acceptance criteria   one bullet per criterion: "- AC-<n>: <testable statement>"; each needs a spec test whose title starts with AC-<n>
## Edge cases            same format, ids continue the numbering
## Out of scope          what the screen deliberately does not do
```

Rules:

- A criterion is a statement a test can fail: observable text, role, event or request, never "looks good".
- One test per criterion, one story per state. A screen that runs a batch always has `partial-failure` among its states.
- The author of the spec owns it. Generated code is accountable to the spec, not the other way around.

## API specs
An API spec lives in `docs/specs/api/` (the traceability check ignores that folder; the criteria are checked by Pest test titles instead):

```
# Spec: <name>
Source: <issue url>
Endpoints: GET /api/..., POST /api/...
## Acceptance criteria   "- AC-<n>: <testable statement>": status codes, response fields, headers, side effects
## Open questions        what the ticket leaves unclear (never invented criteria)
## Out of scope
```
One Pest test per criterion, titled `it('AC-<n>: ...')`. The rules above apply: testable statements, written by a person, the code answers to the spec.

## From a ticket
`/ticket-to-spec <issue>` reads a GitHub issue, writes the UI spec, the API spec or both, stops for approval, then builds. The ticket's criteria are copied, never invented.

Specs: `bulk-approval-preview.md`, `template-field.md`, `dense-list.md`.

How a spec becomes a screen: `/screen-from-spec docs/specs/<spec>.md`. Who checks it: the `screen-reviewer` agent, then a person.
