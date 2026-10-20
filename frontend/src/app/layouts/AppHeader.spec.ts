import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from './AppHeader.vue'

const user = { id: 1, name: 'Ana Approver', email: 'a@x', role: 'approver' as const }
const base = { user, dark: false, stopActive: false }

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AppHeader', () => {
  it('shows the user, role and the main navigation', () => {
    const w = mount(AppHeader, { props: base })

    expect(w.text()).toContain('Ana Approver')
    expect(w.text()).toContain('approver')
    expect(w.get('nav[aria-label="Main"]').text()).toMatch(/Campaigns.*Approvals.*Changelog.*Lab/)
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

  it('offers the emergency stop only to users who can use it, and only while writes are allowed', () => {
    expect(mount(AppHeader, { props: { ...base, canStop: false } }).text()).not.toContain('Emergency stop')
    expect(mount(AppHeader, { props: { ...base, canStop: true, stopActive: true } }).text()).not.toContain('Emergency stop')
    expect(mount(AppHeader, { props: { ...base, canStop: true } }).text()).toContain('Emergency stop')
  })
})
