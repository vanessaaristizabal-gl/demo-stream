import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { lintSource } from './screen-lint.mjs'

const rulesOf = (source: string): string[] => lintSource(source).map((f: { rule: string }) => f.rule)
const fixtures = join(__dirname, '../review-fixtures/weak-screens')
const manifest = JSON.parse(readFileSync(join(fixtures, 'manifest.json'), 'utf8')) as { screens: { file: string; rule: string }[] }

describe('screen-lint on the planted weak screens', () => {
  it.each(manifest.screens)('catches $rule in $file', ({ file, rule }) => {
    expect(rulesOf(readFileSync(join(fixtures, file), 'utf8'))).toContain(rule)
  })

  it('plants exactly five weak screens, one file each', () => {
    expect(manifest.screens).toHaveLength(5)
    expect(
      readdirSync(fixtures)
        .filter((f) => f.endsWith('.vue'))
        .sort(),
    ).toEqual(manifest.screens.map((s) => s.file).sort())
  })
})

describe('screen-lint on real screens', () => {
  const labComponents = join(__dirname, '../src/features/lab')
  const files = [
    'components/BulkApprovalPreview.vue',
    'components/TemplateField.vue',
    'components/DenseList.vue',
    'views/BulkApprovalView.vue',
    'views/DenseListView.vue',
  ]

  it.each(files)('finds nothing in %s', (file) => {
    expect(lintSource(readFileSync(join(labComponents, file), 'utf8'))).toEqual([])
  })
})

describe('screen-lint rules', () => {
  it('does not flag tokens or an error state', () => {
    const ok = `<script setup lang="ts">const r = await api('/x')</script><template><p role="alert">{{ error }}</p></template><style>.a{padding:var(--ds-space-3);color:var(--ds-color-text-default)}</style>`
    expect(rulesOf(ok)).toEqual([])
  })
  it('flags px spacing and a raw colour', () => {
    expect(rulesOf('<template><i /></template><style>.a{margin: 0 12px}</style>')).toEqual(['hard-coded-style'])
    expect(rulesOf('<template><i /></template><style>.a{color:#fff}</style>')).toEqual(['hard-coded-style'])
  })
  it('accepts a page size of 50 and refuses 500', () => {
    expect(rulesOf(`<script setup lang="ts">const q = 'per_page=50'</script><template><i /></template>`)).toEqual([])
    expect(rulesOf(`<script setup lang="ts">const q = 'per_page=500'</script><template><i /></template>`)).toEqual(['loads-all-rows'])
  })
})
