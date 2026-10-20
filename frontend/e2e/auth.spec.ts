import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test('unauthenticated users are sent to the login page', async ({ page }) => {
  await page.goto('/campaigns')
  // the page you asked for is remembered, so signing in brings you back to it
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)campaigns$/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('signing in lands on the campaigns list', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => localStorage.removeItem('stream.token'))
  await page.goto('/login')

  await page.getByLabel('Email').fill('strategist@example.com')
  await page.getByLabel(/^Password/).fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/campaigns$/)
  await expect(page.getByRole('link', { name: 'Spring Camry' })).toBeVisible()
  const header = page.getByRole('banner')
  await expect(header).toContainText('Sam Strategist')
  await expect(header).toContainText('strategist')
})

test('signing out returns to login', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')

  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page).toHaveURL(/\/login$/)
})
