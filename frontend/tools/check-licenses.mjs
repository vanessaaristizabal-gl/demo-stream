#!/usr/bin/env node
// Dependency policy guard: nothing that needs a paid license, a seat, a license key, an account or a token.
// Checks frontend (node_modules) and backend (composer). Run: npm run licenses   (exit 1 on any violation)
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '..')
const backend = resolve(frontend, '../backend')

/** Free and permissive. OFL-1.1 is for fonts. */
export const ALLOWED = [
  'MIT',
  'MIT-0',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'Unlicense',
  'OFL-1.1',
  'Python-2.0',
  'CC-BY-4.0',
]

/** Free but file-level copyleft (MPL-2.0): fine for build/test tools that are not shipped, never for runtime code. */
export const DEV_ONLY_ALLOWED = ['MPL-2.0']

/** Names we refuse on principle (commercial, license-key, or seat-based), whatever their license field says. */
export const BANNED = [
  /^@fortawesome\/pro-/,
  /^ag-grid-enterprise$/,
  /^@syncfusion\//,
  /^@progress\/kendo/,
  /^devextreme/,
  /^@mui\/x-.*-(pro|premium)$/,
  /^@tiptap-pro\//,
  /^@tiptap\/pro/,
]

/** Is a license expression acceptable? "A OR B" (and composer's comma lists) pass if any option does; "A AND B" needs all. */
export function isAllowed(expression, { devOnly = false } = {}) {
  if (!expression || /^(UNKNOWN|UNLICENSED|SEE LICENSE)/i.test(expression)) return false
  const ok = (id) => ALLOWED.includes(id) || (devOnly && DEV_ONLY_ALLOWED.includes(id))
  const clean = expression.replace(/[()]/g, ' ').trim()
  return clean.split(/\s+OR\s+|,/i).some((alt) => alt.split(/\s+AND\s+/i).every((id) => ok(id.trim())))
}

export const isBanned = (name) => BANNED.some((re) => re.test(name))

function licenseOf(pkg) {
  if (typeof pkg.license === 'string') return pkg.license
  if (pkg.license?.type) return pkg.license.type
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type ?? l).join(' OR ')
  return 'UNKNOWN'
}

/** Every installed package, plus the set reachable from production dependencies. */
function frontendPackages() {
  const all = new Map() // dir -> { name, version, license }
  const scan = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.')) continue
      const p = join(dir, entry)
      if (!statSync(p).isDirectory()) continue
      if (entry.startsWith('@')) {
        scan(p)
        continue
      }
      const pj = join(p, 'package.json')
      if (!existsSync(pj)) continue
      const pkg = JSON.parse(readFileSync(pj, 'utf8'))
      all.set(p, {
        name: pkg.name ?? entry,
        version: pkg.version,
        license: licenseOf(pkg),
        deps: { ...pkg.dependencies, ...pkg.optionalDependencies },
      })
      if (existsSync(join(p, 'node_modules'))) scan(join(p, 'node_modules'))
    }
  }
  const nm = join(frontend, 'node_modules')
  if (!existsSync(nm)) return { all, prod: new Set(), missing: true }
  scan(nm)

  const find = (name, from) => {
    for (let dir = from; ; dir = dirname(dir)) {
      const candidate = join(dir, 'node_modules', name)
      if (all.has(candidate)) return candidate
      if (dir === dirname(dir) || dir === dirname(nm)) return null
    }
  }
  const prod = new Set()
  const walk = (dir) => {
    if (prod.has(dir)) return
    prod.add(dir)
    for (const dep of Object.keys(all.get(dir).deps)) {
      const found = find(dep, dir)
      if (found) walk(found)
    }
  }
  const root = JSON.parse(readFileSync(join(frontend, 'package.json'), 'utf8'))
  for (const dep of Object.keys(root.dependencies ?? {})) {
    const found = find(dep, frontend)
    if (found) walk(found)
  }
  return { all, prod, missing: false }
}

export function checkFrontend() {
  const problems = []
  const { all, prod, missing } = frontendPackages()
  if (missing) return { problems: ['frontend/node_modules not found: run npm install first'], count: 0 }

  for (const [dir, p] of all) {
    const label = `${p.name}@${p.version}`
    const inProd = prod.has(dir)
    if (isBanned(p.name)) problems.push(`${label}: banned package (commercial, license-key or seat-based)`)
    else if (!isAllowed(p.license, { devOnly: !inProd }))
      problems.push(`${label}: license "${p.license}" is not allowed${inProd ? ' in runtime code' : ''}`)
  }

  // Private registries mean tokens. Everything must resolve from the public npm registry.
  const lock = join(frontend, 'package-lock.json')
  if (existsSync(lock)) {
    const hosts = new Set([...readFileSync(lock, 'utf8').matchAll(/"resolved":\s*"https?:\/\/([^/"]+)/g)].map((m) => m[1]))
    for (const h of hosts)
      if (h !== 'registry.npmjs.org') problems.push(`package-lock.json resolves packages from "${h}": private registries need tokens`)
  }
  for (const rc of [join(frontend, '.npmrc'), join(frontend, '../.npmrc')]) {
    if (existsSync(rc) && /_authToken|_auth\b|always-auth|npm\.pkg\.github\.com/.test(readFileSync(rc, 'utf8')))
      problems.push(`${rc}: contains registry credentials`)
  }
  return { problems, count: all.size }
}

export function checkBackend(run = spawnSync) {
  const problems = []
  const composer = JSON.parse(readFileSync(join(backend, 'composer.json'), 'utf8'))
  const devNames = new Set(Object.keys(composer['require-dev'] ?? {}))

  for (const repo of composer.repositories ?? []) {
    const url = typeof repo === 'object' ? repo.url : ''
    if (url && !/packagist\.org|github\.com\/(laravel|pestphp)\//.test(url))
      problems.push(`composer.json repository "${url}": private repositories need tokens`)
  }
  if (existsSync(join(backend, 'auth.json')))
    problems.push('backend/auth.json exists: composer credentials must not be part of the project')

  const out = run('composer', ['licenses', '--format=json', '--working-dir', backend], { encoding: 'utf8' })
  if (out.status !== 0)
    return { problems: [...problems, 'composer licenses failed (is composer installed and `composer install` done?)'], count: 0 }

  const deps = JSON.parse(out.stdout).dependencies
  for (const [name, info] of Object.entries(deps)) {
    const label = `${name}@${info.version}`
    const expr = (info.license ?? []).join(' OR ') || 'UNKNOWN'
    if (!isAllowed(expr, { devOnly: devNames.has(name) })) problems.push(`${label}: license "${expr}" is not allowed`)
  }
  for (const name of Object.keys(composer.require ?? {}))
    if (/(^|\/)(nova|spark|forge|vapor)$/.test(name) || name === 'laravel/nova' || name === 'laravel/spark')
      problems.push(`${name}: paid Laravel product`)
  return { problems, count: Object.keys(deps).length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = { frontend: checkFrontend(), backend: checkBackend() }
  let failed = false
  for (const [side, { problems, count }] of Object.entries(results)) {
    if (problems.length) {
      failed = true
      console.error(`\n${side}: ${problems.length} dependency policy violation(s)`)
      for (const p of problems) console.error(`  - ${p}`)
    } else {
      console.log(`${side}: ${count} packages OK (free licenses only, public registries, no keys)`)
    }
  }
  if (failed) {
    console.error(
      '\nPolicy: no paid licenses, license keys, seats, accounts, tokens or private registries. Ask before adding anything outside the allowlist in frontend/tools/check-licenses.mjs.',
    )
    process.exit(1)
  }
}
