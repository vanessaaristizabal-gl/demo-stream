# Setup summary: Claude Code for front-end work in Stream

| Piece | Where | What it does | How to use it |
|---|---|---|---|
| Project context | `CLAUDE.md`, `.claude/rules/` | Conventions: tokens and base components, required states incl. partial failure, keyboard, one test per criterion, no `v-html`, no real accounts | Read automatically every session |
| Specs | `docs/specs/*.md` | Written acceptance criteria and states per screen | Write the spec first; it owns the truth |
| Skill `screen-from-spec` | `.claude/skills/screen-from-spec` | Spec to component, states, one test per criterion (`AC-n`), one story per state, then the reviewer | `/screen-from-spec docs/specs/<spec>.md` |
| Skill `design-language` | `.claude/skills/design-language` | Tokens, base components, states, a11y and security rules as a skill | Loaded by the skill and the reviewer; carried by the plugin |
| Agent `screen-reviewer` | `.claude/agents/screen-reviewer.md` | Read-only review of a screen vs its spec and the design language | "Review `<screen>` with the screen-reviewer against `<spec>`" |
| Hooks | `.claude/settings.json`, `.claude/hooks/` | Block edits to env, secrets, keys, lockfiles; after each front-end edit: format, lint, type check, affected tests, screen check | Automatic; exit 2 makes Claude fix it |
| MCP | `.mcp.json` | Playwright MCP (pinned, free) to walk screens, check keyboard flows, draft e2e | Approve it on first use; verify every generated locator by hand |
| Checks | `frontend/tools/`, `npm run ...` | `traceability`, `budget`, `review:fixtures`, axe in unit and e2e, performance e2e | `npm run check`, `npm run e2e`, `npm run build && npm run budget` |
| Plugin | `plugins/stream-frontend-kit` | Skills, reviewer, hooks and MCP in one installable unit | `npm run plugin:build`; `claude plugin marketplace add ./plugins`; `claude plugin install stream-frontend-kit@stream-local` |
| CI | `.github/workflows/ci.yml` | Types, lint, unit, traceability, fixtures, build, budget, Storybook, Playwright+axe, backend, licenses | Every push |
| Practice lab | `/lab`, `frontend/lab-api/` | Bulk approval, template field, 2,000-row list on a mock that previews, partly fails, locks and rate-limits | `npm run dev`, open `/lab` (dev server only) |
| Review log | `docs/learning-plan/REVIEW_LOG.md` | What was rejected or corrected, and why | Add a row every time |
