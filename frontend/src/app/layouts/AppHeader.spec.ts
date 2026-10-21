import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from './AppHeader.vue'

const user = { id: 1, name: 'Ana Approver', email: 'a@x', role: 'approver' as const }
const base = { user, dark: false }

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AppHeader', () => {
  it('shows the user, role and the main navigation', () => {
    const w = mount(AppHeader, { props: base })

    expect(w.text()).toContain('Ana Approver')
    expect(w.text()).toContain('approver')
    expect(w.get('nav[aria-label="Main"]').text()).toMatch(/Accounts.*Campaigns.*Changelog/)
  })

  it('labels the theme button for the theme it switches to', () => {
    expect(mount(AppHeader, { props: base }).find('[aria-label="Switch to dark theme"]').exists()).toBe(true)
    expect(
      mount(AppHeader, { props: { ...base, dark: true } })
        .find('[aria-label="Switch to light theme"]')
        .exists(),
    ).toBe(true)
  })

  it('emits logout and toggleTheme', async () => {
    const w = mount(AppHeader, { props: base })

    await w.get('[aria-label="Switch to dark theme"]').trigger('click')
    await w.get('[aria-label="Sign out"]').trigger('click')

    expect(w.emitted('toggleTheme')).toHaveLength(1)
    expect(w.emitted('logout')).toHaveLength(1)
  })

  it('shows the Admin link only to admins, and no emergency stop button in the header', () => {
    const admin = { ...user, role: 'admin' as const }
    expect(mount(AppHeader, { props: base }).get('nav[aria-label="Main"]').text()).not.toContain('Admin')
    expect(
      mount(AppHeader, { props: { ...base, user: admin } })
        .get('nav[aria-label="Main"]')
        .text(),
    ).toContain('Admin')
    expect(mount(AppHeader, { props: { ...base, user: admin } }).text()).not.toContain('Emergency stop')
  })
})
