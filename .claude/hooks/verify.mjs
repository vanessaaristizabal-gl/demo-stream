#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): after Claude edits front-end code, type-check the project, run the tests that
// touch the file, and run the deterministic screen checks. Failure exits 2, so Claude sees the output and fixes it
// before moving on. (format.mjs has already formatted and linted the file, including the Vue rules.)
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const file = String(input.tool_input?.file_path ?? '')
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
// In this monorepo the front end is frontend/; a plugin installed in a standalone Vue project has it at the root.
const frontend = existsSync(resolve(root, 'frontend/package.json')) ? resolve(root, 'frontend') : root
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT
const screenLint = pluginRoot ? join(pluginRoot, 'scripts/screen-lint.mjs') : join(frontend, 'tools/screen-lint.mjs')

const inSrc = file.startsWith(resolve(frontend, 'src') + '/')
if (!file || !existsSync(file) || !inSrc || !/\.(vue|ts)$/.test(file)) process.exit(0)

const run = (cmd, args) => spawnSync(cmd, args, { cwd: frontend, encoding: 'utf8' })
const failures = []

const types = run('npx', ['--no-install', 'vue-tsc', '-b'])
if (types.status !== 0) failures.push(`Type check failed (vue-tsc -b):\n${types.stdout || types.stderr}`)

if (/\.vue$/.test(file)) {
  const screen = run('node', [screenLint, file])
  if (screen.status !== 0) failures.push(`Screen check failed (screen-lint):\n${screen.stdout || screen.stderr}`)
}

// Stories are covered by the type check; everything else runs the specs that import it (or the spec itself).
if (!/\.stories\.ts$/.test(file)) {
  if (Number(process.versions.node.split('.')[0]) < 22) {
    console.error(`verify: Node ${process.version} is too old for Vitest; tests skipped. Run \`nvm use\` in frontend/ (.nvmrc).`)
  } else {
    const args = /\.spec\.ts$/.test(file) ? ['--no-install', 'vitest', 'run', file] : ['--no-install', 'vitest', 'related', '--run', '--passWithNoTests', file]
    const tests = run('npx', args)
    if (tests.status !== 0) failures.push(`Tests failed:\n${tests.stdout || tests.stderr}`)
  }
}

if (failures.length > 0) {
  console.error(`Verification failed after editing ${file.replace(root + '/', '')}. Fix it now:\n\n${failures.join('\n\n')}`)
  process.exit(2) // exit 2 = show stderr to Claude
}
