import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test('an admin must confirm before engaging the emergency stop, and can release it', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/campaigns')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Stop all writes?' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0) // nothing engaged yet

  await dialog.getByRole('button', { name: 'Engage emergency stop' }).click()
  await expect(page.getByRole('alert')).toContainText('Emergency stop is active')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Resume writes' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('cancelling the confirmation leaves writes enabled and returns focus to the trigger', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/campaigns')
  const trigger = page.getByRole('button', { name: 'Emergency stop' })

  await trigger.click()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Escape also cancels the confirmation', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/campaigns')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('alertdialog')).toBeHidden()
})

test('only admins see the control', async ({ page }) => {
  await mockApi(page, { role: 'approver' })
  await page.goto('/campaigns')

  await expect(page.getByRole('button', { name: 'Emergency stop' })).toHaveCount(0)
})

test('strategists are told when writes are stopped but cannot lift it', async ({ page }) => {
  await mockApi(page, { role: 'strategist', emergencyStop: true })
  await page.goto('/campaigns')

  await expect(page.getByRole('alert')).toContainText('Emergency stop is active')
  await expect(page.getByRole('button', { name: 'Resume writes' })).toHaveCount(0)
})

test('after engaging the stop, focus lands on the banner instead of being lost', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/campaigns')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  await page.getByRole('button', { name: 'Engage emergency stop' }).click()

  await expect(page.getByRole('alert')).toContainText('Emergency stop is active')
  await expect(page.locator('.banner')).toBeFocused()
})

test('a failed engage keeps the dialog open and says why', async ({ page }) => {
  await mockApi(page, { role: 'admin', stopError: true })
  await page.goto('/campaigns')

  await page.getByRole('button', { name: 'Emergency stop' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByRole('button', { name: 'Engage emergency stop' }).click()

  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('alert')).toContainText('could not be reached')
  await expect(page.locator('.banner')).toHaveCount(0)
})
