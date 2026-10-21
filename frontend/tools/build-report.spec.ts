import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { countStatuses, loadReport, toHtml, toMarkdown } from './build-report.mjs'

const report = loadReport()

describe('the compliance report', () => {
  it('has an English and a Spanish text for every status, exercise and piece of evidence', () => {
    for (const label of Object.values(report.statuses) as { en: string; es: string }[]) expect(label.en && label.es).toBeTruthy()
    for (const section of report.sections) {
      for (const item of section.items) {
        expect(item.ex.en && item.ex.es, item.ex.en).toBeTruthy()
        expect(item.ev.en && item.ev.es, item.ex.en).toBeTruthy()
        expect(Object.keys(report.statuses)).toContain(item.status)
      }
    }
  })

  it('is organised by the weeks of the plan, with the work that came after it in its own section', () => {
    expect(report.sections.map((s: { week: { en: string } }) => s.week.en.split(':')[0])).toEqual([
      'Week 1 (Oct 19 to 23)',
      'Week 2 (Oct 26 to 30)',
      'Week 3 (Nov 2 to 6)',
      'Throughout',
      'Added after the plan (your requests)',
    ])
  })

  it('counts every exercise once', () => {
    const counts = countStatuses(report)
    expect(Object.values(counts).reduce((a: number, b) => a + (b as number), 0)).toBe(
      report.sections.flatMap((s: { items: unknown[] }) => s.items).length,
    )
  })

  it('renders both languages, each with its own labels', () => {
    expect(toHtml(report, 'en')).toContain('Exercise proposed in the plan')
    expect(toHtml(report, 'es')).toContain('Ejercicio propuesto en el plan')
    expect(toHtml(report, 'es')).not.toContain('Exercise proposed in the plan')
  })

  it('escapes text, so nothing in the data becomes markup', () => {
    const risky = { ...report, title: { en: '<b>x</b>', es: '<b>x</b>' } }
    expect(toHtml(risky, 'en')).toContain('&lt;b&gt;x&lt;/b&gt;')
  })

  it('COVERAGE.md is in step with report.json (run npm run report)', () => {
    expect(readFileSync(join(__dirname, '../../docs/learning-plan/COVERAGE.md'), 'utf8')).toBe(toMarkdown(report, 'en') + '\n')
  })
})
