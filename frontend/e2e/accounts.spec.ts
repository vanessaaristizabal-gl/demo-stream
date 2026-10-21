import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

// The accounts page lists every dealer account; an account has its own page (campaigns, launch, changelog) and its own monthly budget.
// Launching runs on the playbooks mock served by Vite, which keeps one state for the whole dev server: these tests run in order.
test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/playbooks/reset') // test control, not an app write
  await mockApi(page, { role: 'strategist' })
})

test('the accounts page lists every account with its own monthly budget and campaign count', async ({ page }) => {
  await page.goto('/accounts')
  await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible()
  const rows = page.getByRole('table', { name: 'Accounts' }).locator('tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: 'Acme Motors' })).toContainText('$5,550.00')
  await expect(rows.filter({ hasText: 'Acme Motors' })).toContainText('Google Ads')
  await expect(rows.filter({ hasText: 'Best Meta Motors' })).toContainText('No budget')

  await page.getByRole('radio', { name: /^Meta Ads/ }).click()
  await expect(rows).toHaveCount(1)
  await expect(rows).toContainText('Best Meta Motors')
})

test('an account has its own page with its campaigns, and Back returns to the list', async ({ page }) => {
  await page.goto('/accounts')
  await page.getByRole('link', { name: 'Acme Motors' }).click()

  await expect(page).toHaveURL(/\/accounts\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: /Acme Motors/ })).toBeVisible()
  await expect(page.getByText('$5,550.00')).toBeVisible()
  const trail = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(trail.getByRole('link', { name: 'Accounts' })).toBeVisible()
  const campaigns = page.getByRole('table', { name: 'Campaigns of this account' }).locator('tbody tr')
  await expect(campaigns).toHaveCount(2)
  await page.getByRole('link', { name: 'Brand - Search' }).click()
  await expect(page).toHaveURL(/\/campaigns\/2$/)

  await page.goBack()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/accounts$/)
})

test('the changelog tab loads only when opened, and an account with no budget says so', async ({ page }) => {
  let requested = 0
  await page.route(
    (url) => url.pathname === '/api/changelog',
    (route) => (requested++, route.fallback()),
  )
  await page.goto('/accounts/1')
  await expect(page.getByRole('heading', { level: 1, name: /Acme Motors/ })).toBeVisible()
  expect(requested).toBe(0)
  await page.getByRole('tab', { name: 'Changelog' }).click()
  await expect(page).toHaveURL(/tab=changelog/)
  await expect(page.getByRole('table', { name: 'Changes on this account' })).toContainText('Daily budget: $100.00 to $200.00')
  expect(requested).toBe(1)

  await page.goto('/accounts/2')
  await expect(page.getByText('No budget in Salesforce')).toBeVisible()
})

test('launching on one account: defaults come from the account, settings change only on request, a preview writes nothing, one approval, retry, receipts', async ({
  page,
}) => {
  await page.goto('/accounts/1?tab=launch')
  await expect(page.getByRole('heading', { name: 'Playbook' })).toBeVisible()
  await expect(page.getByLabel('Launch all campaigns')).toBeChecked() // every campaign is picked to start with
  await expect(page.getByText('5 of 5 campaigns selected')).toBeVisible()
  await page.getByRole('button', { name: 'Continue to settings' }).click()

  await expect(page.getByRole('heading', { name: 'Settings' })).toBeFocused()
  await expect(page.getByText("(this account's monthly budget)")).toBeVisible() // the cap starts from the account's own budget
  await expect(page.getByLabel('Monthly budget cap (USD)')).toHaveCount(0) // nothing to edit unless asked
  await page.getByRole('button', { name: 'Change for this launch' }).click()
  await page.getByLabel('Monthly budget cap (USD)').fill('50')
  await expect(page.getByRole('alert')).toContainText('at least $100.00')
  await expect(page.getByRole('button', { name: 'Build the preview' })).toBeDisabled()
  await page.getByRole('button', { name: 'Use the account defaults' }).click()
  await page.getByRole('button', { name: 'Build the preview' }).click()

  await expect(page.getByText('Preview only: nothing is written until you approve.')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Changes to apply 5' })).toBeVisible()
  await page.getByRole('button', { name: 'Approve 5 changes' }).click()
  const result = page.getByRole('region', { name: 'Result' })
  await expect(result).toContainText('3 applied, 2 failed')
  await expect(result).toBeFocused()
  await page.getByRole('button', { name: 'Retry failed' }).click()
  await expect(result).toContainText('All 5 changes were applied.')
  const receipts = page.getByRole('table', { name: 'Receipts for this batch' })
  await expect(receipts.locator('tbody tr')).toHaveCount(5)
  await expect(receipts).toContainText('validated > compliance > dry-run > write')
  await expect(receipts).toContainText('Launched on Acme Motors')
})

test('an OEM rulebook that does not belong to the account holds every campaign, with the reason', async ({ page }) => {
  await page.goto('/accounts/1?tab=launch')
  await page.getByRole('radio', { name: 'Stellantis' }).click() // Acme Motors is a Toyota account
  await page.getByRole('button', { name: 'Continue to settings' }).click()
  await page.getByRole('button', { name: 'Build the preview' }).click()

  await expect(page.getByRole('tab', { name: 'Held 5' })).toHaveAttribute('aria-selected', 'true') // nothing is ready: open on the reasons
  await expect(page.getByRole('table', { name: 'Held items and the reason for each' })).toContainText('not a Stellantis account')
  await expect(page.getByRole('button', { name: /^Approve/ })).toBeDisabled()
})

test('an account with no Salesforce budget is warned and its campaigns are held', async ({ page }) => {
  await page.goto('/accounts/2?tab=launch')
  await page.getByRole('button', { name: 'Continue to settings' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'has no budget in Salesforce yet' })).toBeVisible()
  await page.getByRole('button', { name: 'Build the preview' }).click()
  await expect(page.getByRole('table', { name: 'Held items and the reason for each' })).toContainText(
    'No active Salesforce budget for this account',
  )
})

test('the launch works with the keyboard alone and keeps the picks when going back', async ({ page }) => {
  await page.goto('/accounts/1?tab=launch')
  const first = page.getByLabel('Launch New models · Search')
  await first.focus()
  await page.keyboard.press('Space') // unpick it
  await expect(page.getByText('4 of 5 campaigns selected')).toBeVisible()
  await page.getByRole('button', { name: 'Continue to settings' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeFocused()
  await page.getByRole('button', { name: 'Previous step' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Launch New models · Search')).not.toBeChecked()
  await expect(page.getByLabel('Launch Used · Search')).toBeChecked()
})
