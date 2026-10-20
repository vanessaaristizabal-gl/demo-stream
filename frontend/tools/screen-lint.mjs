#!/usr/bin/env node
// A deterministic first pass over a screen, before the screen-reviewer agent reads it. It cannot judge; it can only count and match.
//   node tools/screen-lint.mjs src/features/lab           lint real screens (exit 1 on a finding)
//   node tools/screen-lint.mjs --fixtures                 prove it catches the planted weak screens (exit 1 if one is missed)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync as realPath } from 'node:fs'

// Compare real paths: a symlinked folder (macOS /var vs /private/var, a plugin cache) must not stop the CLI from running.
const isMain = () => process.argv[1] !== undefined && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '..')

const block = (source, tag) => [...source.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1]).join('\n')

/** Pure: findings for one .vue source. Each is { rule, message }. */
export function lintSource(source) {
  const findings = []
  const style = block(source, 'style')
  const template = block(source, 'template')
  const script = block(source, 'script')
  const add = (rule, message) => findings.push({ rule, message })

  if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(style + template))
    add('hard-coded-style', 'a colour is written as hex, rgb() or hsl() instead of a semantic token (var(--ds-color-*))')
  if (/(?:padding|margin|gap)(?:-[a-z]+)?\s*:\s*[^;]*\b\d+px/.test(style))
    add('hard-coded-style', 'spacing is written in px instead of a spacing token (var(--ds-space-*))')
  if (/\sv-html\s*=|:inner-?html\s*=/i.test(template)) add('v-html', 'raw HTML is rendered; text a user typed must be rendered as text')
  if (/per_page[=:]\s*['"]?(\d+)/.test(script) && Number(script.match(/per_page[=:]\s*['"]?(\d+)/)[1]) > 100)
    add('loads-all-rows', 'asks for more than one page of rows; the server must page, sort and filter')
  const callsApi = /\bapi\s*[<(]|\bfetch\s*\(|store\.\w*(?:fetch|apply|save)/.test(script)
  if (callsApi && !/role="alert"|tone="danger"|\berror\b/.test(template))
    add('missing-error-state', 'it calls the API but its template has no error state')
  if (/\.applied\b/.test(script + template) && !/\.failed\b|\bfailures?\b/.test(script + template))
    add('batch-drops-failures', 'it reads the applied items of a batch but never the failed ones')
  return findings
}

function vueFiles(path) {
  if (statSync(path).isFile()) return path.endsWith('.vue') ? [path] : []
  return readdirSync(path).flatMap((name) => (name === 'node_modules' ? [] : vueFiles(join(path, name))))
}

if (isMain()) {
  const args = process.argv.slice(2)
  if (args[0] === '--fixtures') {
    const dir = join(frontend, 'review-fixtures/weak-screens')
    const { screens } = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))
    let missed = 0
    for (const s of screens) {
      const rules = new Set(lintSource(readFileSync(join(dir, s.file), 'utf8')).map((f) => f.rule))
      const caught = rules.has(s.rule)
      if (!caught) missed++
      console.log(`${caught ? 'caught' : 'MISSED'}  ${s.file}  (${s.weakness})`)
    }
    console.log(`${screens.length - missed}/${screens.length} planted weaknesses caught by the first pass`)
    process.exit(missed ? 1 : 0)
  }
  let found = 0
  for (const file of args.flatMap((p) => vueFiles(resolve(p)))) {
    for (const f of lintSource(readFileSync(file, 'utf8'))) {
      found++
      console.log(`${file.replace(frontend + '/', '')}: [${f.rule}] ${f.message}`)
    }
  }
  console.log(found ? `${found} finding(s)` : 'screen-lint: no findings')
  process.exit(found ? 1 : 0)
}
