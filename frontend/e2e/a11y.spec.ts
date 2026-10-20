import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './mock-api'

// WCAG 2.2 AA is the target; axe-core covers the automatable subset (roughly a third of the criteria).
// It does not replace keyboard and screen-reader checks.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function audit(page: Page) {
  // Measure a settled page: axe reads computed colors, and a CSS transition still running gives blended values.
  await page.waitForFunction(() => document.getAnimations().length === 0)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`)).toEqual([])
}

const pages = [
  ['campaigns', '/campaigns'],
  ['campaign detail', '/campaigns/1'],
  ['approvals', '/approvals'],
  ['changelog', '/changelog'],
  ['campaigns, Meta tab', '/campaigns?tab=meta'],
  ['new simulated campaign', '/campaigns/new'],
  ['simulated campaign', '/campaigns/simulated/1'],
  ['simulated campaign structure', '/campaigns/simulated/1?tab=structure'],
  ['simulated campaign settings', '/campaigns/simulated/1?tab=settings'],
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      // reducedMotion: components fade in; auditing mid-fade measures blended colors.
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.addInitScript((s) => localStorage.setItem('stream.theme', s), scheme)
    })

    test('login has no automatable WCAG 2.2 AA violations', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
      await audit(page)
    })

    for (const [name, path] of pages) {
      test(`${name} has no automatable WCAG 2.2 AA violations`, async ({ page }) => {
        await mockApi(page, { role: 'approver' })
        await page.goto(path)
        await expect(page.getByRole('banner')).toBeVisible()
        await page.waitForLoadState('networkidle')
        await audit(page)
      })
    }

    test('the emergency stop confirmation dialog has no violations', async ({ page }) => {
      await mockApi(page, { role: 'admin' })
      await page.goto('/campaigns')
      await page.getByRole('button', { name: 'Emergency stop' }).click()
      await expect(page.getByRole('alertdialog')).toBeVisible()
      await audit(page)
    })

    test('emergency banner has no violations', async ({ page }) => {
      await mockApi(page, { role: 'admin', emergencyStop: true })
      await page.goto('/campaigns')
      await expect(page.getByRole('alert')).toBeVisible()
      await audit(page)
    })
  })
}

for (const [name, path, ready] of [
  ['approvals', '/approvals', 'Change request 7'],
  ['campaigns', '/campaigns', null],
  ['changelog', '/changelog', null],
  ['campaign detail', '/campaigns/1', null],
] as const) {
  test(`${name} is usable on a phone: no horizontal page scroll and every button label fully visible`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 })
    await mockApi(page, { role: 'approver' })
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    if (ready) await expect(page.getByRole('article', { name: ready })).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0)

    for (const button of await page.getByRole('button').all()) {
      if (!(await button.isVisible())) continue
      const clipped = await button.evaluate((el) => {
        const label = el.querySelector('.app-button-label, .p-togglebutton-label') ?? el
        return label.scrollWidth > label.clientWidth + 1
      })
      expect(clipped, `clipped button: ${await button.innerText()}`).toBe(false)
    }
  })
}
