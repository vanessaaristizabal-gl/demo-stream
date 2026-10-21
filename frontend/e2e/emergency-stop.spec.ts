import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

// The emergency stop is an admin control. It lives on the Admin page (not in the header of every page, where a red button
// invites a mistake), explains what it does, asks for confirmation, and its banner is visible to everyone while it is on.
test('an admin finds the emergency stop on the Admin page, must confirm, and can release it', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/campaigns')
  await expect(page.getByRole('button', { name: 'Emergency stop' })).toHaveCount(0) // not in the header
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Admin' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Admin' })).toBeVisible()
  await expect(page.getByText('Writes are enabled')).toBeVisible()
  await expect(page.getByText('campaigns keep running as they are')).toBeVisible()
  await page.getByRole('button', { name: 'Emergency stop' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Stop all writes?' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0) // nothing engaged yet

  await dialog.getByRole('button', { name: 'Engage emergency stop' }).click()
  await expect(page.getByRole('alert')).toContainText('Emergency stop is active')
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Writes are stopped')).toBeVisible()

  await page.getByRole('button', { name: 'Resume writes' }).first().click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('Writes are enabled')).toBeVisible()
})

test('cancelling the confirmation leaves writes enabled and returns focus to the trigger', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/admin')
  const trigger = page.getByRole('button', { name: 'Emergency stop' })

  await trigger.click()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Escape also cancels the confirmation', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/admin')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('alertdialog')).toBeHidden()
})

test('only admins have the Admin page: others do not see the link and are sent to Campaigns', async ({ page }) => {
  await mockApi(page, { role: 'approver' })
  await page.goto('/campaigns')
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Admin' })).toHaveCount(0)

  await page.goto('/admin')
  await expect(page).toHaveURL(/\/campaigns$/)
  await expect(page.getByRole('button', { name: 'Emergency stop' })).toHaveCount(0)
})

test('strategists are told when writes are stopped but cannot lift it', async ({ page }) => {
  await mockApi(page, { role: 'strategist', emergencyStop: true })
  await page.goto('/campaigns')

  await expect(page.getByRole('alert')).toContainText('Emergency stop is active')
  await expect(page.getByRole('button', { name: 'Resume writes' })).toHaveCount(0)
})

test('after engaging the stop, focus lands on the status instead of being lost', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/admin')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  await page.getByRole('button', { name: 'Engage emergency stop' }).click()

  await expect(page.getByRole('alert')).toContainText('Emergency stop is active')
  await expect(page.getByRole('status').filter({ hasText: 'Writes are stopped' })).toBeFocused()
})

test('a failed engage keeps the dialog open and says why', async ({ page }) => {
  await mockApi(page, { role: 'admin', stopError: true })
  await page.goto('/admin')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByRole('button', { name: 'Engage emergency stop' }).click()

  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('alert')).toContainText('could not be reached')
  await expect(page.locator('.banner')).toHaveCount(0)
})

test('the OEM rulebooks tab lists each version with its dates in the shared format and opens to show the rules', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/admin')
  await page.getByRole('tab', { name: 'OEM rulebooks' }).click()
  await expect(page).toHaveURL(/tab=rulebooks/)

  const version = page.getByRole('button', { name: /Toyota rulebook v1/ })
  await expect(version).toContainText('effective Jan 1, 2026')
  await expect(version).toHaveAttribute('aria-expanded', 'false')
  await version.click()
  await expect(page.getByRole('list', { name: 'Rules of Toyota rulebook v1' })).toContainText('TOY-001: Daily budget cannot exceed $500.')
})
