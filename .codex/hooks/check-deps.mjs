#!/usr/bin/env node
// PostToolUse (Bash): after installing or updating a dependency, enforce the dependency policy
// (no paid licenses, license keys, seats, accounts, tokens or private registries). Exit 2 shows the problem to Claude.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const cmd = String(input.tool_input?.command ?? '')

const changesDependencies = /\b(npm|pnpm|yarn)\s+(i|install|add|update|up|rm|remove|uninstall)\b|\bcomposer\s+(require|update|install|remove)\b/.test(cmd)
if (!changesDependencies) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const r = spawnSync('node', ['tools/check-licenses.mjs'], { cwd: resolve(root, 'frontend'), encoding: 'utf8' })

if (r.status !== 0) {
  console.error(`Dependency policy violated by the last command:\n${r.stderr || r.stdout}\nRemove the cause: uninstall the package (npm rm / composer remove), or delete the registry credentials or private registry. Ask the user before keeping anything the policy rejects.`)
  process.exit(2)
}
