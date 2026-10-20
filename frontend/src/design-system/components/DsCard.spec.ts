import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsCard from './DsCard.vue'

describe('DsCard', () => {
  it('renders a div by default and the requested element otherwise', () => {
    expect(mount(DsCard, { slots: { default: 'x' } }).element.tagName).toBe('DIV')
    expect(mount(DsCard, { props: { as: 'article' }, slots: { default: 'x' } }).element.tagName).toBe('ARTICLE')
  })

  it('can drop its padding', () => {
    expect(mount(DsCard, { props: { padded: false } }).classes()).not.toContain('ds-card--padded')
  })

  it('passes attributes such as aria-label to the root', () => {
    expect(mount(DsCard, { props: { as: 'article' }, attrs: { 'aria-label': 'Change 1' } }).attributes('aria-label')).toBe('Change 1')
  })
})
