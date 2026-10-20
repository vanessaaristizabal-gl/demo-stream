import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsBreadcrumb from './DsBreadcrumb.vue'

const items = [
  { label: 'Home', href: '/campaigns' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Spring Camry', href: '/campaigns/1' },
]
const make = (props: Record<string, unknown> = {}) => mount(DsBreadcrumb, { props: { items, ...props } })

describe('DsBreadcrumb', () => {
  it('is a labelled navigation landmark with an ordered list', () => {
    const w = make()

    expect(w.get('nav').attributes('aria-label')).toBe('Breadcrumb')
    expect(w.get('ol').findAll('li')).toHaveLength(3)
  })

  it('allows the landmark label to be overridden', () => {
    expect(make({ label: 'Trail' }).get('nav').attributes('aria-label')).toBe('Trail')
  })

  it('links every ancestor and marks the last item as the current page (not a link)', () => {
    const w = make()

    expect(w.findAll('a').map((a) => [a.text(), a.attributes('href')])).toEqual([
      ['Home', '/campaigns'],
      ['Campaigns', '/campaigns'],
    ])
    const current = w.get('[aria-current="page"]')
    expect(current.text()).toBe('Spring Camry')
    expect(current.element.tagName).toBe('SPAN')
  })

  it('hides the visual separators from assistive technology', () => {
    const seps = make().findAll('svg')

    expect(seps).toHaveLength(2)
    expect(seps.every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
  })

  it('emits navigate for a plain click and prevents the page reload', async () => {
    const w = make()
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })

    w.findAll('a')[1].element.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(true)
    expect(w.emitted('navigate')).toEqual([[items[1]]])
  })

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey']])('leaves %s-clicks to the browser (open in a new tab)', async (key) => {
    const w = make()
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, [key]: true })

    w.findAll('a')[0].element.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(false)
    expect(w.emitted('navigate')).toBeUndefined()
  })

  it('renders a single item as the current page', () => {
    const w = make({ items: [items[0]] })

    expect(w.findAll('a')).toHaveLength(0)
    expect(w.get('[aria-current="page"]').text()).toBe('Home')
  })
})
