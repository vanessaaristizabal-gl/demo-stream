#!/usr/bin/env node
// Performance budget for the production bundle: fails the build when the JavaScript a first visit loads, or any single
// route chunk, grows past the limits in perf-budget.json. Run: npm run budget   (after npm run build)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { realpathSync as realPath } from 'node:fs'

// Compare real paths: a symlinked folder (macOS /var vs /private/var, a plugin cache) must not stop the CLI from running.
const isMain = () => process.argv[1] !== undefined && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '..')

/** Pure: sizes are gzip bytes per file, `initial` is the set of files index.html loads. Returns the list of violations. */
export function checkBudget(sizes, initial, budget) {
  const violations = []
  const initialBytes = [...initial].reduce((sum, file) => sum + (sizes[file] ?? 0), 0)
  if (initialBytes > budget.initialGzipKb * 1024) {
    violations.push(`initial JavaScript is ${(initialBytes / 1024).toFixed(1)} kB gzip, budget ${budget.initialGzipKb} kB`)
  }
  for (const [file, bytes] of Object.entries(sizes)) {
    if (!initial.has(file) && bytes > budget.chunkGzipKb * 1024) {
      violations.push(`${file} is ${(bytes / 1024).toFixed(1)} kB gzip, chunk budget ${budget.chunkGzipKb} kB`)
    }
  }
  return violations
}

export function measure(dist) {
  const assets = join(dist, 'assets')
  const sizes = Object.fromEntries(
    readdirSync(assets)
      .filter((f) => f.endsWith('.js'))
      .map((f) => [f, gzipSync(readFileSync(join(assets, f))).length]),
  )
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const initial = new Set([...html.matchAll(/assets\/([^"']+\.js)/g)].map((m) => m[1]))
  return { sizes, initial }
}

if (isMain()) {
  const dist = join(frontend, 'dist')
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('budget: dist/ not found. Run `npm run build` first.')
    process.exit(1)
  }
  const budget = JSON.parse(readFileSync(join(frontend, 'perf-budget.json'), 'utf8')).bundle
  const { sizes, initial } = measure(dist)
  const violations = checkBudget(sizes, initial, budget)
  const initialKb = ([...initial].reduce((s, f) => s + (sizes[f] ?? 0), 0) / 1024).toFixed(1)
  if (violations.length > 0) {
    console.error(`Performance budget exceeded:\n- ${violations.join('\n- ')}`)
    process.exit(1)
  }
  console.log(
    `budget: initial JavaScript ${initialKb} kB gzip (limit ${budget.initialGzipKb}), ${Object.keys(sizes).length} chunks within ${budget.chunkGzipKb} kB`,
  )
}
