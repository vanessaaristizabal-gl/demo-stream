import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test('every page shows where you are with a breadcrumb', async ({ page }) => {
  await mockApi(page, { role: 'approver' })
  const trail = page.getByRole('navigation', { name: 'Breadcrumb' })

  await page.goto('/campaigns')
  await expect(trail).toContainText('Home')
  await expect(trail.locator('[aria-current="page"]')).toHaveText('Campaigns')

  await page.goto('/approvals')
  await expect(trail.locator('[aria-current="page"]')).toHaveText('Approvals')

  await page.goto('/changelog')
  await expect(trail.locator('[aria-current="page"]')).toHaveText('Changelog')
})

test('the campaign page names itself once loaded and links back up the trail', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns/1')
  const trail = page.getByRole('navigation', { name: 'Breadcrumb' })

  await expect(trail.locator('[aria-current="page"]')).toHaveText('Spring Camry')
  await trail.getByRole('link', { name: 'Campaigns' }).click()

  await expect(page).toHaveURL(/\/campaigns$/)
})

test('the Home crumb goes to the start page', async ({ page }) => {
  await mockApi(page)
  await page.goto('/changelog')

  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home' }).click()

  await expect(page).toHaveURL(/\/campaigns$/)
})

test('Back appears only on nested pages and returns to the previous page', async ({ page }) => {
  await mockApi(page)
  await page.goto('/approvals')
  // Wait for the first navigation to finish: a click during it is resolved by the router as a replace (no history entry).
  await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()
  await page.getByRole('link', { name: 'Campaigns' }).first().click()
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible()
  await page.getByRole('link', { name: 'Spring Camry' }).click()
  await expect(page).toHaveURL(/\/campaigns\/1$/)

  await page.getByRole('button', { name: 'Back' }).click()

  await expect(page).toHaveURL(/\/campaigns$/)
})

test('Back is never a dead end: a campaign opened directly goes up to the list', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns/1') // no history, like a shared link

  await page.getByRole('button', { name: 'Back' }).click()

  await expect(page).toHaveURL(/\/campaigns$/)
})

for (const [name, path] of [
  ['campaigns', '/campaigns'],
  ['approvals', '/approvals'],
  ['changelog', '/changelog'],
] as const) {
  test(`${name} is a main page: no Back, even after navigating from elsewhere`, async ({ page }) => {
    await mockApi(page, { role: 'approver' })
    await page.goto(name === 'campaigns' ? '/changelog' : '/campaigns')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: new RegExp(name, 'i') })
      .click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))

    await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0)
  })
}

test('the login page has no breadcrumb or Back', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0)
})

test('signing in lands on the page you were trying to open', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => localStorage.removeItem('stream.token')) // signed out
  await page.goto('/approvals')

  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)approvals$/)
  await page.getByLabel('Email').fill('approver@example.com')
  await page.getByLabel(/^Password/).fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/approvals$/)
})

test('a crafted redirect cannot send you to another site after signing in', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => localStorage.removeItem('stream.token'))
  await page.goto('/login?redirect=https://evil.example')

  await page.getByLabel('Email').fill('approver@example.com')
  await page.getByLabel(/^Password/).fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/localhost:5173\/campaigns$/)
})

for (const path of ['/nope', '/campaigns/abc', '/approvals/7/extra']) {
  test(`${path} shows a not-found page inside the app shell`, async ({ page }) => {
    await mockApi(page)
    await page.goto(path)

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    await page.getByRole('link', { name: 'go to campaigns' }).click()
    await expect(page).toHaveURL(/\/campaigns$/)
  })
}

test('the first Tab stop is a skip link that moves focus to the main content', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible()

  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()

  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
})
