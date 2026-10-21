import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { buildPlugin, PLUGIN_NAME, stripFrontMatter } from './build-plugin.mjs'

// "Installs in a clean sandbox": build the plugin into an empty folder and use only what is in it.
const sandbox = mkdtempSync(join(tmpdir(), 'plugin-sandbox-'))
const out: string = buildPlugin(join(sandbox, PLUGIN_NAME))
afterAll(() => rmSync(sandbox, { recursive: true, force: true }))

const json = (path: string) => JSON.parse(readFileSync(join(out, path), 'utf8'))

describe('stripFrontMatter', () => {
  it('removes the front matter and keeps the body', () => {
    expect(stripFrontMatter('---\npaths:\n  - x\n---\n\n# Title\ntext')).toBe('\n# Title\ntext')
    expect(stripFrontMatter('# No front matter')).toBe('# No front matter')
  })
})

describe('the packaged plugin', () => {
  it('has a manifest with a name and a version', () => {
    expect(json('.claude-plugin/plugin.json')).toMatchObject({ name: PLUGIN_NAME, version: expect.stringMatching(/^\d+\.\d+\.\d+$/) })
  })

  it('carries the skills, the three front-end reviewers, the hooks and both MCP servers', () => {
    for (const skill of [
      'screen-from-spec',
      'design-language',
      'create-vue-component',
      'create-pinia-store',
      'frontend-conventions',
      'ux-information-design',
    ]) {
      expect(existsSync(join(out, 'skills', skill, 'SKILL.md')), skill).toBe(true)
    }
    for (const agent of ['screen-reviewer', 'frontend-code-reviewer', 'a11y-reviewer'])
      expect(existsSync(join(out, 'agents', `${agent}.md`)), agent).toBe(true)
    expect(existsSync(join(out, 'agents/backend-code-reviewer.md'))).toBe(false) // a front-end plugin
    for (const path of [
      'hooks/guard-files.mjs',
      'hooks/verify.mjs',
      'scripts/screen-lint.mjs',
      'skills/create-vue-component/scripts/new-component.mjs',
    ]) {
      expect(existsSync(join(out, path)), path).toBe(true)
    }
    const servers = json('.mcp.json').mcpServers
    expect(Object.keys(servers)).toEqual(['playwright', 'chrome-devtools'])
    expect(servers.playwright.args[0]).toMatch(/^@playwright\/mcp@\d+\.\d+\.\d+$/) // pinned, never "latest"
    expect(servers['chrome-devtools'].args[0]).toMatch(/^chrome-devtools-mcp@\d+\.\d+\.\d+$/)
  })

  it('carries the repo rules as skills, because a plugin does not load .claude/rules/', () => {
    const conventions = readFileSync(join(out, 'skills/frontend-conventions/SKILL.md'), 'utf8')
    for (const topic of [
      'TypeScript rules',
      'UI library and dependency policy',
      'HTML and accessibility rules',
      'Dates, money and display formats',
      'Frontend testing',
    ])
      expect(conventions).toContain(topic)
    expect(conventions).not.toContain('paths:') // the rules' own front matter is not copied
    expect(readFileSync(join(out, 'skills/ux-information-design/SKILL.md'), 'utf8')).toContain('Choose the pattern by what the content is')
  })

  it('tells the scaffold skill and the reviewers where things live once installed', () => {
    expect(readFileSync(join(out, 'skills/create-vue-component/SKILL.md'), 'utf8')).toContain(
      'node ${CLAUDE_PLUGIN_ROOT}/skills/create-vue-component/scripts/new-component.mjs',
    )
    expect(readFileSync(join(out, 'agents/frontend-code-reviewer.md'), 'utf8')).toContain('## Running from the plugin')
  })

  it('moves the design-language conventions into a skill, because plugins do not load a CLAUDE.md', () => {
    const skill = readFileSync(join(out, 'skills/design-language/SKILL.md'), 'utf8')
    for (const topic of [
      'Tokens and base components',
      'States every screen handles',
      'Accessibility',
      'Security',
      'v-html',
      'Idempotency-Key',
    ])
      expect(skill).toContain(topic)
  })

  it('every hook command points at a file that is inside the plugin', () => {
    const commands = Object.values(json('hooks/hooks.json').hooks).flatMap((groups) =>
      (groups as { hooks: { command: string }[] }[]).flatMap((g) => g.hooks.map((h) => h.command)),
    )
    expect(commands).toHaveLength(2)
    for (const command of commands) {
      const file = /\$\{CLAUDE_PLUGIN_ROOT\}\/(\S+?)"/.exec(command)?.[1]
      expect(file, command).toBeTruthy()
      expect(existsSync(join(out, file!)), file).toBe(true)
    }
  })

  it('the packaged guard hook blocks a secrets file, run from the plugin folder with no repo around it', () => {
    const r = spawnSync('node', [join(out, 'hooks/guard-files.mjs')], {
      input: JSON.stringify({ tool_input: { file_path: '/project/.env' } }),
      encoding: 'utf8',
      cwd: sandbox,
    })
    expect(r.status).toBe(2)
    const ok = spawnSync('node', [join(out, 'hooks/guard-files.mjs')], {
      input: JSON.stringify({ tool_input: { file_path: '/project/src/App.vue' } }),
      encoding: 'utf8',
      cwd: sandbox,
    })
    expect(ok.status).toBe(0)
  })

  it('the packaged verify hook ignores files outside src and the packaged screen check catches v-html', () => {
    const outside = spawnSync('node', [join(out, 'hooks/verify.mjs')], {
      input: JSON.stringify({ tool_input: { file_path: join(sandbox, 'README.md') } }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: sandbox, CLAUDE_PLUGIN_ROOT: out },
      encoding: 'utf8',
    })
    expect(outside.status).toBe(0)

    const bad = join(sandbox, 'Bad.vue')
    writeFileSync(bad, '<script setup lang="ts">const c = "x"</script><template><p v-html="c" /></template>')
    const lint = spawnSync('node', [join(out, 'scripts/screen-lint.mjs'), bad], { encoding: 'utf8' })
    expect(lint.status).toBe(1)
    expect(lint.stdout).toMatch(/\[v-html\]/)
  })

  it('is in step with its sources: the checked-in plugin folder equals a fresh build', () => {
    const checkedIn = join(__dirname, '../../plugins', PLUGIN_NAME)
    for (const file of [
      'skills/design-language/SKILL.md',
      'skills/screen-from-spec/SKILL.md',
      'skills/frontend-conventions/SKILL.md',
      'skills/ux-information-design/SKILL.md',
      'skills/create-vue-component/SKILL.md',
      'agents/screen-reviewer.md',
      'agents/frontend-code-reviewer.md',
      'agents/a11y-reviewer.md',
      'hooks/verify.mjs',
      'hooks/guard-files.mjs',
      'scripts/screen-lint.mjs',
      'hooks/hooks.json',
      '.mcp.json',
    ]) {
      expect(readFileSync(join(checkedIn, file), 'utf8'), `${file} is stale: run npm run plugin:build`).toBe(
        readFileSync(join(out, file), 'utf8'),
      )
    }
  })
})
