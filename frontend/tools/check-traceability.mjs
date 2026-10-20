#!/usr/bin/env node
// Traceability: every acceptance criterion in docs/specs/*.md has a test titled "AC-<n>: ..." in the component's spec file,
// and every state has a Storybook story. Run: npm run traceability   (exit 1 on any gap)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync as realPath } from 'node:fs'

// Compare real paths: a symlinked folder (macOS /var vs /private/var, a plugin cache) must not stop the CLI from running.
const isMain = () => process.argv[1] !== undefined && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '..')
const specsDir = resolve(frontend, '../docs/specs')

const pascal = (state) =>
  state
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')

/** Pure: parse one spec document. */
export function parseSpec(markdown) {
  const section = (name) =>
    markdown
      .split(/^## /m)
      .find((s) => s.startsWith(name))
      ?.split('\n')
      .slice(1)
      .join('\n') ?? ''
  return {
    name: markdown.match(/^# Spec: (.+)$/m)?.[1]?.trim() ?? null,
    component: markdown.match(/^Component: (\S+)$/m)?.[1] ?? null,
    states: [...section('States').matchAll(/^- ([a-z-]+)\s*$/gm)].map((m) => m[1]),
    criteria: [...(section('Acceptance criteria') + section('Edge cases')).matchAll(/^- (AC-\d+): (.+)$/gm)].map((m) => m[1]),
  }
}

/** Pure: gaps between a parsed spec and the text of its test file and stories file. */
export function findGaps(spec, testSource, storySource) {
  const gaps = []
  const tested = new Set([...testSource.matchAll(/\b(?:it|test)(?:\.\w+)?\(\s*(['"`])(AC-\d+):/g)].map((m) => m[2]))
  for (const ac of spec.criteria) if (!tested.has(ac)) gaps.push(`${ac} has no test titled "${ac}: ..."`)
  for (const ac of tested) if (!spec.criteria.includes(ac)) gaps.push(`${ac} is tested but is not in the spec`)
  const stories = new Set([...storySource.matchAll(/export const (\w+)\b/g)].map((m) => m[1]))
  for (const state of spec.states) if (!stories.has(pascal(state))) gaps.push(`state "${state}" has no story named ${pascal(state)}`)
  const duplicates = spec.criteria.filter((ac, i) => spec.criteria.indexOf(ac) !== i)
  for (const ac of new Set(duplicates)) gaps.push(`${ac} appears twice in the spec`)
  return gaps
}

if (isMain()) {
  const files = readdirSync(specsDir).filter((f) => f.endsWith('.md') && f !== 'README.md')
  let failed = false
  for (const file of files) {
    const spec = parseSpec(readFileSync(join(specsDir, file), 'utf8'))
    const base = spec.component ? join(frontend, 'src', spec.component) : null
    const problems = []
    if (!spec.name || !base) problems.push('the spec needs a "# Spec:" title and a "Component:" line')
    else if (!existsSync(`${base}.vue`)) problems.push(`${spec.component}.vue does not exist`)
    else {
      const read = (ext) => (existsSync(base + ext) ? readFileSync(base + ext, 'utf8') : '')
      if (!existsSync(`${base}.spec.ts`)) problems.push(`${spec.component}.spec.ts does not exist`)
      if (!existsSync(`${base}.stories.ts`)) problems.push(`${spec.component}.stories.ts does not exist`)
      problems.push(...findGaps(spec, read('.spec.ts'), read('.stories.ts')))
    }
    if (problems.length) failed = true
    console.log(
      `${problems.length ? 'FAIL' : 'ok  '} ${file}: ${spec.criteria.length} criteria, ${spec.states.length} states${problems.map((p) => `\n       - ${p}`).join('')}`,
    )
  }
  process.exit(failed ? 1 : 0)
}
