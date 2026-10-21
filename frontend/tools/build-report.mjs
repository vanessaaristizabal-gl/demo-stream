#!/usr/bin/env node
// Builds the learning-plan compliance report from one source, docs/learning-plan/report.json:
//   docs/learning-plan/COVERAGE.md                       (English, per week, for reading in the repo)
//   docs/learning-plan/Compliance_Report_EN.pdf          (English)
//   docs/learning-plan/Reporte_Cumplimiento_ES.pdf       (Spanish)
// Run: npm run report   (a test checks that COVERAGE.md is in step with report.json)
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const learning = resolve(here, '../../docs/learning-plan')

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

export function loadReport() {
  return JSON.parse(readFileSync(join(learning, 'report.json'), 'utf8'))
}

/** Pure: how many items have each status. */
export function countStatuses(report) {
  const counts = Object.fromEntries(Object.keys(report.statuses).map((k) => [k, 0]))
  for (const section of report.sections) for (const item of section.items) counts[item.status] += 1
  return counts
}

/** Pure: the English report as Markdown. */
export function toMarkdown(report, lang = 'en') {
  const counts = countStatuses(report)
  const summary = Object.entries(report.statuses)
    .map(([key, label]) => `${label[lang]}: ${counts[key]}`)
    .join(' | ')
  const out = [`# ${report.title[lang]}`, '', report.subtitle[lang], '', `**${summary}**`, '', report.results[lang], '']
  for (const section of report.sections) {
    out.push(
      `## ${section.week[lang]}`,
      '',
      lang === 'en' ? '| Exercise | Status | Evidence or what is left |' : '| Ejercicio | Estado | Evidencia o pendiente |',
      '|---|---|---|',
    )
    for (const item of section.items) out.push(`| ${item.ex[lang]} | ${report.statuses[item.status][lang]} | ${item.ev[lang]} |`)
    out.push('')
  }
  return out.join('\n')
}

const CLASSES = { done: 'ok', partial: 'part', you: 'you', blocked: 'blocked', changed: 'chg', notdone: 'no', out: 'out' }

/** Pure: the report as a printable HTML page. */
export function toHtml(report, lang) {
  const counts = countStatuses(report)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const cards = Object.entries(report.statuses)
    .map(([key, label]) => `<div><b>${counts[key]}</b>${esc(label[lang])}</div>`)
    .join('')
  const head =
    lang === 'en'
      ? ['Exercise proposed in the plan', 'Status', 'Evidence or what is left']
      : ['Ejercicio propuesto en el plan', 'Estado', 'Evidencia o pendiente']
  const sections = report.sections
    .map(
      (s) =>
        `<h2>${esc(s.week[lang])}</h2><table><tr><th style="width:38%">${head[0]}</th><th style="width:14%">${head[1]}</th><th>${head[2]}</th></tr>` +
        s.items
          .map(
            (i) =>
              `<tr><td>${esc(i.ex[lang])}</td><td><span class="b ${CLASSES[i.status]}">${esc(report.statuses[i.status][lang])}</span></td><td>${esc(i.ev[lang])}</td></tr>`,
          )
          .join('') +
        '</table>',
    )
    .join('')
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${esc(report.title[lang])}</title><style>
body{font-family:Helvetica,Arial,sans-serif;color:#1a2233;font-size:9pt;line-height:1.35}
h1{font-size:18pt;margin:0 0 2mm;color:#1f3a7a}h2{font-size:11.5pt;color:#1f3a7a;border-bottom:1.5px solid #1f3a7a;padding-bottom:1mm;margin:6mm 0 2mm;break-after:avoid}
.sub{color:#555;margin-bottom:4mm}table{width:100%;border-collapse:collapse;margin-bottom:2mm}
th{background:#eaf0fb;text-align:left;padding:2mm;font-size:8pt}td{padding:2mm;border-bottom:1px solid #d9e0ee;vertical-align:top}tr{break-inside:avoid}
.b{display:inline-block;padding:.6mm 2mm;border-radius:2mm;font-weight:bold;font-size:7.2pt;white-space:nowrap}
.ok{background:#d8f0dc;color:#14602a}.part{background:#fdeccb;color:#7a4b00}.you{background:#dbe7fb;color:#1c3f8a}.blocked{background:#fbe3e1;color:#8c1d18}.chg{background:#e9e4f5;color:#4a2f8a}.no{background:#eee;color:#444}.out{background:#e6e6e6;color:#333}
.sum{display:flex;gap:3mm;margin:3mm 0}.sum div{flex:1;border:1px solid #d9e0ee;border-radius:2mm;padding:2mm;text-align:center;font-size:7.5pt}.sum b{font-size:15pt;display:block}
.note{background:#f6f8fc;border-left:3px solid #1f3a7a;padding:2.5mm 3mm;margin:3mm 0}
</style><body><h1>${esc(report.title[lang])}</h1><div class="sub">${esc(report.subtitle[lang])}</div>
<div class="sum">${cards}<div><b>${total}</b>${lang === 'en' ? 'Exercises' : 'Ejercicios'}</div></div>
<div class="note">${esc(report.results[lang])}</div>${sections}</body></html>`
}

async function main() {
  const report = loadReport()
  writeFileSync(join(learning, 'COVERAGE.md'), toMarkdown(report, 'en') + '\n')
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  for (const [lang, file] of [
    ['en', 'Compliance_Report_EN.pdf'],
    ['es', 'Reporte_Cumplimiento_ES.pdf'],
  ]) {
    await page.setContent(toHtml(report, lang))
    await page.pdf({
      path: join(learning, file),
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="font-size:8px;width:100%;text-align:center;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    })
    console.log(`written ${file}`)
  }
  await browser.close()
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main()
