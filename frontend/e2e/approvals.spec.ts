import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

// Approvals are a tab of Campaigns: a change request is a change to a campaign. Each request is a row with icon buttons.
const row = (page: import('@playwright/test').Page) => page.getByRole('row', { name: /Spring Camry/ })

test('the Approvals tab shows how many changes are waiting, in its label', async ({ page }) => {
  await mockApi(page, { role: 'approver' })
  await page.goto('/campaigns')
  await expect(page.getByRole('tab', { name: 'Approvals 1' })).toBeVisible()
  await page.getByRole('tab', { name: 'Approvals 1' }).click()
  await expect(page).toHaveURL(/tab=approvals/)
  await expect(row(page)).toContainText('Status: active to paused')
})

test('an approver approves a pending change from its row', async ({ page }) => {
  const log = await mockApi(page, { role: 'approver' })
  await page.goto('/campaigns?tab=approvals')

  await expect(row(page)).toContainText('pending approval')
  await row(page).getByRole('button', { name: 'Approve the change to Spring Camry' }).click()

  await page.getByRole('radio', { name: /^All/ }).click()
  await expect(row(page)).toContainText('applied')
  await expect(row(page)).toContainText('by Ana Approver')
  await expect(row(page).getByRole('button')).toHaveCount(0)
  expect(log.decisions).toEqual(['approve'])
})

test('an approver can reject from the row', async ({ page }) => {
  const log = await mockApi(page, { role: 'approver' })
  await page.goto('/campaigns?tab=approvals')

  await row(page).getByRole('button', { name: 'Reject the change to Spring Camry' }).click()

  await page.getByRole('radio', { name: /^All/ }).click()
  await expect(row(page)).toContainText('rejected')
  expect(log.decisions).toEqual(['reject'])
})

test('strategists see the requests but no decision buttons', async ({ page }) => {
  await mockApi(page, { role: 'strategist' })
  await page.goto('/campaigns?tab=approvals')

  await expect(row(page)).toContainText('Waiting for an approver')
  await expect(page.getByRole('button', { name: /^(Approve|Reject)/ })).toHaveCount(0)
})

test('the decision buttons work with the keyboard alone', async ({ page }) => {
  const log = await mockApi(page, { role: 'approver' })
  await page.goto('/campaigns?tab=approvals')
  const approve = page.getByRole('button', { name: 'Approve the change to Spring Camry' })
  await approve.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => log.decisions).toEqual(['approve'])
})

test('the old Approvals address lands on the tab', async ({ page }) => {
  await mockApi(page, { role: 'approver' })
  await page.goto('/approvals')
  await expect(page).toHaveURL(/\/campaigns\?tab=approvals/)
  await expect(page.getByRole('tab', { name: /^Approvals/ })).toHaveAttribute('aria-selected', 'true')
})
