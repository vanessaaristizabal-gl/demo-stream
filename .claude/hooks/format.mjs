#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): format the file that was just written, lint it, then refresh anything generated from it.
// Formatting never fails the call; lint errors (architecture boundaries, date formats, icons...) exit 2 so Claude fixes them now.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { syncGenerated } from './lib/sync-generated.mjs'

const input = JSON.parse(readFileSync(0, 'utf8'))
const file = String(input.tool_input?.file_path ?? '')
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
if (!file || !existsSync(file)) process.exit(0)

const inDir = (dir) => file.startsWith(resolve(root, dir) + '/')
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: 'utf8' })

if (inDir('frontend') && /\.(vue|ts|js|mjs|json|css|html)$/.test(file) && !/\/(node_modules|dist|storybook-static)\//.test(file)) {
  const cwd = resolve(root, 'frontend')
  const fmt = run('npx', ['--no-install', 'prettier', '--write', file], cwd)
  if (fmt.status !== 0) console.error(`format: prettier exited ${fmt.status}\n${fmt.stderr || fmt.stdout}`)

  if (/\.(vue|ts|js|mjs)$/.test(file)) {
    const lint = run('npx', ['--no-install', 'eslint', file], cwd)
    if (lint.status !== 0) {
      console.error(`ESLint found problems in ${file.replace(root + '/', '')}. Fix them (rules explain why):\n${lint.stdout || lint.stderr}`)
      process.exit(2)
    }
  }
} else if (inDir('backend') && file.endsWith('.php')) {
  const pint = run('./vendor/bin/pint', ['-q', file], resolve(root, 'backend'))
  if (pint.status !== 0) console.error(`format: pint exited ${pint.status}\n${pint.stderr || pint.stdout}`)
}

const syncError = syncGenerated(file, root)
if (syncError) {
  console.error(syncError)
  process.exit(2)
}
