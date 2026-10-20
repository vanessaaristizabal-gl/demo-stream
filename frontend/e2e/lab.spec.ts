import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './mock-api'

// The practice lab: its own mock backend is served by Vite (lab-api/), the shell (sign-in, /me) by mockApi.
// The lab mock keeps one state for the whole dev server, so these tests run one after another.
test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/lab/reset') // test control, not an app write: restores the mock's initial state
  await mockApi(page, { role: 'strategist' })
})

const audit = async (page: Page) => {
  await page.waitForFunction(() => document.getAnimations().length === 0)
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
}

test.describe('bulk approval preview', () => {
  test('previews, approves once, shows the 12 failures and retries them', async ({ page }) => {
    await page.goto('/lab/bulk')
    await expect(page.getByRole('heading', { name: 'Bulk approval preview' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Bulk approval')
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible() // nested page

    const summary = page.getByRole('term').filter({ hasText: 'Held' }).locator('xpath=following-sibling::dd')
    await expect(summary).toHaveText('15')
    await expect(page.getByRole('table', { name: 'Held items and the reason for each' })).toContainText('Locked by manufacturer rule')

    await page.getByRole('button', { name: 'Approve 285 changes' }).click()
    const result = page.getByRole('region', { name: 'Result' })
    await expect(result).toContainText('273 applied, 12 failed')
    await expect(result).toContainText('5 stopped at the provider rate limit')
    await expect(result).toBeFocused()
    await expect(page.getByRole('table', { name: 'Failed items' }).locator('tbody tr')).toHaveCount(12)

    await page.getByRole('button', { name: 'Retry failed' }).click()
    await expect(result).toContainText('All 285 changes were applied.')
    await expect(page.getByRole('button', { name: 'Retry failed' })).toHaveCount(0)
  })

  test('the whole flow works with the keyboard alone', async ({ page }) => {
    await page.goto('/lab/bulk')
    const approve = page.getByRole('button', { name: /^Approve/ })
    await expect(approve).toBeVisible()
    await approve.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: 'Result' })).toContainText('273 applied, 12 failed')
    const retry = page.getByRole('button', { name: 'Retry failed' })
    await retry.focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('region', { name: 'Result' })).toContainText('All 285 changes were applied.')
  })

  test('shows an error with Try again when the preview fails', async ({ page }) => {
    let fail = true
    await page.route('**/api/lab/bulk/preview', async (route) => {
      if (fail)
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Preview service is down' }) })
      return route.fallback()
    })
    await page.goto('/lab/bulk')
    await expect(page.getByRole('alert')).toContainText('Preview service is down')
    fail = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('button', { name: /^Approve/ })).toBeVisible()
  })
})

test.describe('template field', () => {
  test('counts the filled-in text, flags overflow per dealer and unknown placeholders', async ({ page }) => {
    await page.goto('/lab/template')
    const field = page.getByLabel('Ad headline template')
    await expect(page.getByText('Peak Subaru - 0% APR', { exact: true })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'characters for Peak Subaru' })).toHaveText(
      '20 / 30 characters for Peak Subaru',
    )

    await field.fill('{{ dealer.name }} - 0% APR this month!')
    await expect(page.getByRole('alert')).toContainText('character limit') // Peak Subaru + 21 chars = 32
    await expect(field).toHaveAttribute('aria-invalid', 'true')

    await field.fill('{{ dealer.nme }}')
    await expect(page.getByRole('alert')).toHaveText('Unknown placeholder: dealer.nme')
    await field.fill('{{ dealer.name }} 0% APR')
    await expect(page.getByText('Too long for 2 dealers:')).toBeVisible()
  })
})

test.describe('dense list', () => {
  test('pages, filters and sorts on the server, never holding more than one page', async ({ page }) => {
    const sizes: number[] = []
    page.on('response', async (r) => {
      if (new URL(r.url()).pathname === '/api/lab/rows' && r.request().method() === 'GET') sizes.push((await r.json()).data.length)
    })
    await page.goto('/lab/rows')
    await expect(page.getByText('2,000 campaigns', { exact: true })).toBeVisible()
    await expect(page.getByRole('table', { name: 'Campaigns' }).locator('tbody tr')).toHaveCount(50)

    await page.getByRole('radio', { name: 'Paused' }).click()
    await expect(page.getByText('500 campaigns', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Daily budget' }).click()
    await expect(page.getByRole('columnheader', { name: /Daily budget/ })).toHaveAttribute('aria-sort', 'ascending')
    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByText('Page 2 of 10')).toBeVisible()
    expect(Math.max(...sizes)).toBeLessThanOrEqual(50)
  })

  test('an inline edit succeeds, a locked one is rejected with its reason, and too many edits are rate limited', async ({ page }) => {
    await page.goto('/lab/rows')
    await expect(page.getByRole('table', { name: 'Campaigns' })).toBeVisible()

    await page.getByRole('button', { name: 'Edit budget for Campaign 0001' }).click()
    await page.getByLabel('Daily budget in dollars for Campaign 0001').fill('123.45')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('row', { name: /Campaign 0001/ })).toContainText('$123.45')
    await expect(page.getByRole('button', { name: 'Edit budget for Campaign 0001' })).toBeFocused()

    await page.getByRole('button', { name: 'Edit budget for Campaign 0010' }).click()
    await page.getByLabel('Daily budget in dollars for Campaign 0010').fill('99')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('row', { name: /Campaign 0010/ }).getByRole('alert')).toContainText('Locked by manufacturer rule')

    for (const id of ['0002', '0003', '0004', '0005']) {
      await page.getByRole('button', { name: `Edit budget for Campaign ${id}` }).click()
      await page.getByLabel(`Daily budget in dollars for Campaign ${id}`).fill('50')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('row', { name: new RegExp(`Campaign ${id}`) })).toContainText('$50.00')
    }
    await page.getByRole('button', { name: 'Edit budget for Campaign 0006' }).click()
    await page.getByLabel('Daily budget in dollars for Campaign 0006').fill('50')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('row', { name: /Campaign 0006/ }).getByRole('alert')).toContainText('Retry in')
  })

  test('keyboard: Escape cancels an edit', async ({ page }) => {
    await page.goto('/lab/rows')
    await page.getByRole('button', { name: 'Edit budget for Campaign 0001' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByLabel('Daily budget in dollars for Campaign 0001')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Edit budget for Campaign 0001' })).toBeFocused()
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme accessibility`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.addInitScript((s) => localStorage.setItem('stream.theme', s), scheme)
    })
    for (const [name, path, ready] of [
      ['lab hub', '/lab', 'Practice area'],
      ['bulk approval', '/lab/bulk', 'Approve 285 changes'],
      ['template field', '/lab/template', 'Preview'],
      ['dense list', '/lab/rows', '2,000 campaigns'],
    ] as const) {
      test(`${name} has no automatable WCAG 2.2 AA violations`, async ({ page }) => {
        await page.goto(path)
        await expect(page.getByText(ready).first()).toBeVisible()
        await audit(page)
      })
    }

    test('bulk approval after a partial failure has no violations', async ({ page }) => {
      await page.goto('/lab/bulk')
      await page.getByRole('button', { name: /^Approve/ }).click()
      await expect(page.getByRole('region', { name: 'Result' })).toContainText('12 failed')
      await audit(page)
    })
  })
}

test('the lab screens do not scroll the page sideways at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  for (const path of ['/lab', '/lab/bulk', '/lab/template', '/lab/rows']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${path} scrolls horizontally`).toBeLessThanOrEqual(0)
  }
})
