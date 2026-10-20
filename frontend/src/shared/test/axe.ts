import axe from 'axe-core'
import { expect } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'

/**
 * Runs axe on a mounted component (WCAG 2.2 AA tags). The wrapper must be mounted with `attachTo: document.body`.
 * jsdom has no layout or computed colours, so contrast and layout rules are off here; Playwright (e2e/a11y.spec.ts) covers them.
 */
export async function expectNoA11yViolations(wrapper: VueWrapper): Promise<void> {
  const { violations } = await axe.run(wrapper.element as HTMLElement, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`)).toEqual([])
}
