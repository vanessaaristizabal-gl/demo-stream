#!/usr/bin/env node
// Accessibility and performance audit through the Chrome DevTools MCP server (Google, Apache-2.0, no account or key):
// for every page it reads the browser's accessibility tree, runs a Lighthouse audit (accessibility, best practices, SEO) for
// desktop and mobile, and records a performance trace (LCP and CLS). It fails when a limit in perf-budget.json is broken.
// SEO is reported but not enforced: this is an internal, signed-in app and robots.txt keeps crawlers out on purpose.
//
//   npm run dev                      (and the Laravel backend: php artisan serve)
//   npm run audit:devtools           [-- --base http://localhost:5173] [--desktop-only] [--no-lab]
//
// The same server is configured for Claude Code in .mcp.json, so an agent can run the same checks interactively.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startMcp } from './lib/mcp-client.mjs'

const here = dirname(fileURLToPath(import.meta.url))
export const DEVTOOLS_MCP = 'chrome-devtools-mcp@1.11.0'

/** The pages to audit: path, and the heading that proves the page is ready. */
export const PAGES = [
  ['/login', 'Sign in', { public: true }],
  ['/campaigns', 'Campaigns'],
  ['/campaigns?tab=meta', 'Campaigns'],
  ['/approvals', 'Approvals'],
  ['/changelog', 'Changelog'],
  ['/lab', 'Lab', { lab: true }],
  ['/lab/deploy', 'Deploy a playbook', { lab: true }],
  ['/lab/bulk', 'Bulk approval preview', { lab: true }],
  ['/lab/template', 'Template field', { lab: true }],
  ['/lab/rows', 'Dense list', { lab: true }],
]

/** Pure: scores and failed audits from the text of a lighthouse_audit result. */
export function parseLighthouse(text) {
  const score = (label) => {
    const m = new RegExp(`- ${label}: (\\d+)`).exec(text)
    return m ? Number(m[1]) : null
  }
  return {
    accessibility: score('Accessibility'),
    bestPractices: score('Best Practices'),
    seo: score('SEO'),
    failed: [...text.matchAll(/^- ([\w-]+) \[([\w-]+)\]: (.+?) \(score/gm)].map((m) => ({ id: m[1], category: m[2], title: m[3] })),
  }
}

/** Pure: LCP (ms) and CLS from the text of a performance trace summary. */
export function parseTrace(text) {
  const lcp = /LCP: (\d+) ms/.exec(text)
  const cls = /CLS: ([\d.]+)/.exec(text)
  return { lcpMs: lcp ? Number(lcp[1]) : null, cls: cls ? Number(cls[1]) : null }
}

const INTERACTIVE = 'button|link|textbox|combobox|checkbox|radio|tab|switch|menuitem|searchbox|slider|spinbutton'

/** Pure: problems in the accessibility tree that a person using a screen reader would hit. */
export function checkTree(snapshot, { public: isPublic = false } = {}) {
  const lines = snapshot.split('\n')
  const problems = []
  const headings1 = lines.filter((l) => /\bheading\b.*level="1"/.test(l)).length
  if (headings1 !== 1) problems.push(`expected one h1, found ${headings1}`)
  if (!lines.some((l) => /uid=\S+ main\b/.test(l))) problems.push('no main landmark')
  if (!isPublic && !lines.some((l) => /uid=\S+ navigation\b/.test(l))) problems.push('no navigation landmark')
  if (!isPublic && !lines.some((l) => /uid=\S+ banner\b/.test(l))) problems.push('no banner (header) landmark')
  for (const l of lines) {
    const unnamed = new RegExp(`uid=\\S+ (${INTERACTIVE})(?: [^"]*)?$`).exec(l)
    if (unnamed) problems.push(`a ${unnamed[1]} has no accessible name: ${l.trim()}`)
  }
  return problems
}

function pageIdOf(text) {
  const m = /(\d+): .*\[selected\]/.exec(text)
  if (!m) throw new Error(`could not find the selected page in: ${text}`)
  return Number(m[1])
}

async function main() {
  const args = process.argv.slice(2)
  const flag = (name) => args.includes(name)
  const value = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback)
  const base = value('--base', 'http://localhost:5173').replace(/\/$/, '')
  const email = value('--email', 'strategist@example.com')
  const password = value('--password', 'password')
  const devices = flag('--desktop-only') ? ['desktop'] : ['desktop', 'mobile']
  const limits = JSON.parse(readFileSync(resolve(here, '../perf-budget.json'), 'utf8')).devtools
  const pages = PAGES.filter(([, , o]) => !(flag('--no-lab') && o?.lab))

  const mcp = startMcp('npx', [
    '-y',
    DEVTOOLS_MCP,
    '--headless',
    '--isolated',
    '--no-performance-crux',
    '--no-usage-statistics',
    '--no-file-navigations',
  ])
  const failures = []
  const rows = []
  try {
    await mcp.initialize()
    const opened = await mcp.call('new_page', { url: `${base}/login` })
    const pageId = pageIdOf(opened)

    // Sign in through the real form, the way a person does. A snapshot's uids are only valid for that snapshot, so read
    // the form right before filling it.
    let signedIn = false
    async function signIn() {
      await mcp.call('navigate_page', { pageId, type: 'url', url: `${base}/login` })
      await mcp.call('wait_for', { pageId, text: ['Sign in'] })
      const form = await mcp.call('take_snapshot', { pageId })
      const uid = (re) => /uid=(\S+)/.exec(form.split('\n').find((l) => re.test(l)) ?? '')?.[1]
      const [emailUid, passwordUid, signInUid] = [uid(/textbox "Email"/), uid(/textbox "Password"/), uid(/button "Sign in"/)]
      if (!emailUid || !passwordUid || !signInUid) throw new Error(`the sign-in form was not found in the accessibility tree:\n${form}`)
      await mcp.call('fill', { pageId, uid: emailUid, value: email })
      await mcp.call('fill', { pageId, uid: passwordUid, value: password })
      await mcp.call('click', { pageId, uid: signInUid })
      await mcp.call('wait_for', { pageId, text: ['Campaigns'] })
      signedIn = true
    }

    for (const [path, heading, options] of pages) {
      if (!options?.public && !signedIn) await signIn()
      await mcp.call('navigate_page', { pageId, type: 'url', url: `${base}${path}` })
      await mcp.call('wait_for', { pageId, text: [heading] })

      const problems = checkTree(await mcp.call('take_snapshot', { pageId }), { public: options?.public })
      const result = { path, public: Boolean(options?.public), tree: problems, lighthouse: {}, trace: null }
      for (const device of devices) {
        result.lighthouse[device] = parseLighthouse(await mcp.call('lighthouse_audit', { pageId, mode: 'navigation', device }))
      }
      result.trace = parseTrace(await mcp.call('performance_start_trace', { pageId, reload: true, autoStop: true }))
      rows.push(result)

      for (const p of problems) failures.push(`${path}: accessibility tree: ${p}`)
      for (const [device, lh] of Object.entries(result.lighthouse)) {
        if ((lh.accessibility ?? 0) < limits.accessibility)
          failures.push(
            `${path} (${device}): accessibility ${lh.accessibility}, limit ${limits.accessibility}: ${lh.failed
              .filter((f) => f.category === 'accessibility')
              .map((f) => f.id)
              .join(', ')}`,
          )
        if ((lh.bestPractices ?? 0) < limits.bestPractices)
          failures.push(
            `${path} (${device}): best practices ${lh.bestPractices}, limit ${limits.bestPractices}: ${lh.failed
              .filter((f) => f.category === 'best-practices')
              .map((f) => f.id)
              .join(', ')}`,
          )
        failures.push(
          `${path} (${device}): SEO ${lh.seo}, limit ${limits.seo}: ${lh.failed
            .filter((f) => f.category === 'seo')
            .map((f) => f.id)
            .join(', ')}`,
        )
      }
      if (result.trace.lcpMs === null || result.trace.lcpMs > limits.lcpMs)
        failures.push(`${path}: LCP ${result.trace.lcpMs} ms, limit ${limits.lcpMs} ms`)
      if (result.trace.cls === null || result.trace.cls > limits.cls) failures.push(`${path}: CLS ${result.trace.cls}, limit ${limits.cls}`)

      const lh = result.lighthouse
      console.log(
        `${problems.length ? 'FAIL' : 'ok  '} ${path.padEnd(22)} a11y ${Object.values(lh)
          .map((x) => x.accessibility)
          .join('/')}  best ${Object.values(lh)
          .map((x) => x.bestPractices)
          .join('/')}  seo ${Object.values(lh)
          .map((x) => x.seo)
          .join('/')}  LCP ${result.trace.lcpMs} ms  CLS ${result.trace.cls}`,
      )
    }
  } finally {
    mcp.close()
  }

  if (failures.length > 0) {
    console.error(`\nAudit failed (${failures.length}):\n- ${failures.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`\naudit: ${rows.length} pages (${devices.join(' and ')}) within the limits in perf-budget.json`)
}

import { realpathSync } from 'node:fs'
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
