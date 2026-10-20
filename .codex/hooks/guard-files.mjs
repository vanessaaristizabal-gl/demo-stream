#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit): refuse edits to secrets, lockfiles and already-shipped migrations.
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const path = String(input.tool_input?.file_path ?? '')
const name = basename(path)

const rules = [
  [/^\.env(\..+)?$/.test(name) && name !== '.env.example', 'Secrets live in .env and must not be edited by the agent. Edit .env.example for new keys.'],
  [['package-lock.json', 'composer.lock'].includes(name), 'Lockfiles are generated: change dependencies with npm/composer instead.'],
  [/\/(vendor|node_modules)\//.test(path), 'Do not edit vendored dependencies.'],
]

const hit = rules.find(([matches]) => matches)
if (hit) {
  console.error(`Blocked: ${hit[1]} (${path})`)
  process.exit(2) // exit 2 = block the tool call and show stderr to Claude
}
