import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test('an approver approves a pending change', async ({ page }) => {
  const log = await mockApi(page, { role: 'approver' })
  await page.goto('/approvals')

  const card = page.getByRole('article', { name: 'Change request 7' })
  await expect(card).toContainText('pending approval')
  await card.getByRole('button', { name: 'Approve' }).click()

  await expect(card).toContainText('applied')
  await expect(card).toContainText('Decided by Ana Approver')
  await expect(card.getByRole('button', { name: 'Approve' })).toHaveCount(0)
  expect(log.decisions).toEqual(['approve'])
})

test('an approver can reject', async ({ page }) => {
  await mockApi(page, { role: 'approver' })
  await page.goto('/approvals')

  await page.getByRole('button', { name: 'Reject' }).click()

  await expect(page.getByRole('article', { name: 'Change request 7' })).toContainText('rejected')
})

test('strategists see requests but no decision buttons', async ({ page }) => {
  await mockApi(page, { role: 'strategist' })
  await page.goto('/approvals')

  await expect(page.getByRole('article', { name: 'Change request 7' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0)
})
