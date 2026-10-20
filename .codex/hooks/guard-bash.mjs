#!/usr/bin/env node
// PreToolUse (Bash): block commands that destroy data or bypass review.
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(0, 'utf8'))
const cmd = String(input.tool_input?.command ?? '')

const rules = [
  [/\bmigrate:fresh\b|\bmigrate:reset\b|\bdb:wipe\b/, 'Destructive database command. Run it yourself if you really mean it, on a local database.'],
  [/git\s+push\b.*(--force|-f\b)/, 'Force-push is not allowed from the agent.'],
  [/git\s+(commit|push)\b.*--no-verify/, 'Do not skip git hooks.'],
  [/\brm\s+-rf?\s+(\/|~|\$HOME)(\s|$)/, 'Refusing a recursive delete of a root/home path.'],
  [/(^|[;&|]\s*|\bexport\s+)PROVIDERS_DRIVER=live\b/,'Live ad-provider writes must go through the governed path on a deployed environment, not from the agent shell.'],
]

const hit = rules.find(([re]) => re.test(cmd))
if (hit) {
  console.error(`Blocked: ${hit[1]}`)
  process.exit(2)
}
