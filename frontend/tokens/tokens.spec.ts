import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM build script, no types
import { build, loadTokens, resolveRefs } from './build.mjs'

const root = resolve(__dirname, '..')
const tokens = loadTokens()
type Mode = 'light' | 'dark'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** WCAG 2.x relative luminance and contrast ratio. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const color = (mode: Mode, dotted: string): string => {
  const node = dotted.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], tokens.semantic[mode].color)
  if (typeof node !== 'string') throw new Error(`Unknown semantic color "${dotted}" in ${mode}`)
  return resolveRefs(tokens, node)
}

function walk(dir: string, exts: string[]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p, exts) : exts.some((e) => p.endsWith(e)) ? [p] : []
  })
}

describe('contrast helper', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
  })
})

describe('design tokens', () => {
  it('resolves every reference', () => {
    expect(() => build(tokens)).not.toThrow()
  })

  it('has a generated CSS and TS that match tokens.json (run `npm run tokens`)', () => {
    const { css, ts } = build(tokens)
    expect(readFileSync(join(root, 'src/design-system/tokens/tokens.css'), 'utf8')).toBe(css)
    expect(readFileSync(join(root, 'src/design-system/tokens/tokens.ts'), 'utf8')).toBe(ts)
  })

  it('defines exactly the same semantic colors in light and dark', () => {
    const keys = (m: Mode) => JSON.stringify(Object.keys(JSON.parse(JSON.stringify(tokens.semantic[m].color))).sort())
    expect(keys('dark')).toBe(keys('light'))
    const flat = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [p + k] : flat(v, `${p}${k}.`)))
    expect(flat(tokens.semantic.dark.color).sort()).toEqual(flat(tokens.semantic.light.color).sort())
  })

  for (const mode of ['light', 'dark'] as const) {
    describe(`WCAG 2.2 contrast in ${mode} mode`, () => {
      for (const pair of tokens.contrast as { fg: string; bg: string; min: number; note?: string }[]) {
        it(`${pair.fg} on ${pair.bg} >= ${pair.min}:1${pair.note ? ` (${pair.note})` : ''}`, () => {
          const ratio = contrast(color(mode, pair.fg), color(mode, pair.bg))
          expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(pair.min)
        })
      }
    })
  }
})

describe('token usage in source', () => {
  const sources = walk(join(root, 'src'), ['.vue', '.css', '.ts']).filter(
    (f) => !f.includes('/design-system/tokens/') && !f.endsWith('.spec.ts'),
  )
  const generated = readFileSync(join(root, 'src/design-system/tokens/tokens.css'), 'utf8')
  const defined = new Set([...generated.matchAll(/(--ds-[a-z0-9-]+):/g)].map((m) => m[1]))

  it('only references tokens that exist', () => {
    // A name ending in "-" is a dynamic prefix (e.g. 'var(--ds-space-' + n + ')'): it must match at least one real token.
    const exists = (name: string) => (name.endsWith('-') ? [...defined].some((d) => d.startsWith(name)) : defined.has(name))
    const unknown = sources.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/var\((--ds-[a-z0-9-]+)/g)]
        .filter((m) => !exists(m[1]))
        .map((m) => `${f.replace(root, '')}: ${m[1]}`),
    )
    expect(unknown).toEqual([])
  })

  it('has no raw hex colors in components or styles (use tokens)', () => {
    const offenders = walk(join(root, 'src'), ['.vue', '.css'])
      .filter((f) => !f.includes('/design-system/tokens/'))
      .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/(?<![&\w])#[0-9a-fA-F]{3,8}\b/g)].map((m) => `${f.replace(root, '')}: ${m[0]}`))
    expect(offenders).toEqual([])
  })

  it('does not use primitive color tokens in components (use semantic ones)', () => {
    const primitiveColor = /var\(--ds-color-(white|slate|blue|red|amber|green)(-\d+)?\)/
    const offenders = sources
      .filter((f) => f.includes('/components/') || f.includes('/features/') || f.includes('/app/'))
      .filter((f) => primitiveColor.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => f.replace(root, ''))).toEqual([])
  })
})
