import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

// The hooks are what Claude cannot skip. These tests run them the way Claude Code does: JSON on stdin, exit code 2 blocks.
const root = resolve(__dirname, '../..')
const hook = (name: string, filePath: string) =>
  spawnSync('node', [join(root, '.claude/hooks', name)], {
    input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    encoding: 'utf8',
  })

describe('guard-files (PreToolUse): environment and secrets files cannot be edited', () => {
  it.each([
    '.env',
    '.env.local',
    '.env.production',
    'backend/.env',
    'certs/server.pem',
    'deploy/private.key',
    'credentials.json',
    'config/secrets.yml',
    '.npmrc',
    'package-lock.json',
  ])('blocks %s', (path) => {
    const r = hook('guard-files.mjs', join(root, path))
    expect(r.status, r.stderr).toBe(2)
    expect(r.stderr).toMatch(/Blocked/)
  })

  it.each(['.env.example', 'frontend/src/app/App.vue', 'docs/secrets-policy.md', 'frontend/src/shared/api/client.ts'])(
    'allows %s',
    (path) => {
      expect(hook('guard-files.mjs', join(root, path)).status).toBe(0)
    },
  )
})

describe('verify (PostToolUse): a front-end edit is type-checked and its tests run', () => {
  // Each case writes into its own throwaway folder under src/ (the hook only looks there) and removes it afterwards.
  const base = join(root, 'frontend/src/shared/utils/__hook_probe__')
  afterAll(() => rmSync(base, { recursive: true, force: true }))
  function withFiles(files: Record<string, string>, edited: string): ReturnType<typeof hook> {
    const dir = join(base, randomUUID())
    mkdirSync(dir, { recursive: true })
    try {
      for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content)
      return hook('verify.mjs', join(dir, edited))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  it('does nothing for a file outside frontend/src', () => {
    expect(hook('verify.mjs', join(root, 'docs/architecture.md')).status).toBe(0)
  })

  it('blocks an edit that does not type-check', () => {
    const r = withFiles({ 'broken.ts': "export const n: number = 'not a number'\n" }, 'broken.ts')
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/Type check failed/)
    expect(r.stderr).toMatch(/not assignable to type 'number'/)
  }, 120_000)

  it('blocks an edit whose affected test fails', () => {
    const r = withFiles(
      {
        'rule.ts': 'export const limit = 31\n',
        'rule.spec.ts':
          "import { expect, it } from 'vitest'\nimport { limit } from './rule'\nit('the limit is 30', () => expect(limit).toBe(30))\n",
      },
      'rule.ts',
    )
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/Tests failed/)
    expect(r.stderr).toMatch(/the limit is 30/)
  }, 120_000)

  it('blocks a screen that renders user text with v-html', () => {
    const r = withFiles(
      { 'Bad.vue': '<script setup lang="ts">\nconst copy = "x"\n</script>\n<template><p v-html="copy" /></template>\n' },
      'Bad.vue',
    )
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/\[v-html\]/)
  }, 120_000)

  it('passes a correct edit', () => {
    const r = withFiles({ 'ok.ts': 'export const ok = 1\n' }, 'ok.ts')
    expect(r.status, r.stderr).toBe(0)
  }, 120_000)
})
