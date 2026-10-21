import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { agentToToml, computeMirror, REPO } from './sync-codex.mjs'

describe('agentToToml', () => {
  it('keeps the name, the description and the body, which needs no escaping', () => {
    const toml = agentToToml(
      '---\nname: demo\ndescription: Does a thing\ntools: Read\n---\n\nBody with `code`, "quotes" and a \\ backslash.\n',
    )
    expect(toml).toBe(
      'name = "demo"\ndescription = "Does a thing"\ndeveloper_instructions = \'\'\'\nBody with `code`, "quotes" and a \\ backslash.\n\'\'\'\n',
    )
  })

  it('refuses an agent without front matter', () => {
    expect(() => agentToToml('no front matter')).toThrow('front matter')
  })
})

describe('the Codex mirror', () => {
  const mirror: Map<string, string> = computeMirror()

  it('mirrors every agent, including both code reviewers', () => {
    const agents = [...mirror.keys()].filter((p) => p.startsWith('.codex/agents/')).sort()
    expect(agents).toEqual(
      ['a11y-reviewer', 'backend-code-reviewer', 'frontend-code-reviewer', 'screen-reviewer', 'write-path-guardian'].map(
        (n) => `.codex/agents/${n}.toml`,
      ),
    )
    expect(existsSync(join(REPO, '.claude/agents/code-reviewer.md'))).toBe(false) // split by stack
  })

  it.each([...computeMirror().keys()])('%s is in step with its source in .claude/ (run npm run sync:codex)', (path) => {
    expect(readFileSync(join(REPO, path), 'utf8')).toBe(mirror.get(path))
  })
})
