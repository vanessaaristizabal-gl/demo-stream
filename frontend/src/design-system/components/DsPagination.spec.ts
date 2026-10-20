import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DsPagination from './DsPagination.vue'

const make = (page: number, pageCount: number) => mount(DsPagination, { props: { page, pageCount, 'onUpdate:page': () => {} } })

describe('DsPagination', () => {
  it('renders nothing for a single page', () => {
    expect(make(1, 1).find('nav').exists()).toBe(false)
  })

  it('announces the position politely and exposes a labelled nav', () => {
    const w = make(2, 5)

    expect(w.get('nav').attributes('aria-label')).toBe('Pagination')
    expect(w.get('[aria-live="polite"]').text()).toBe('Page 2 of 5')
  })

  it('disables previous on the first page and next on the last', () => {
    expect(make(1, 3).get('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(make(3, 3).get('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    expect(make(2, 3).get('[aria-label="Next page"]').attributes('disabled')).toBeUndefined()
  })

  it('emits the new page', async () => {
    const w = make(2, 5)

    await w.get('[aria-label="Next page"]').trigger('click')
    await w.get('[aria-label="Previous page"]').trigger('click')

    expect(w.emitted('update:page')).toEqual([[3], [1]])
  })

  describe('keyboard focus', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })
    const mountReal = (page: number, pageCount: number) => {
      const w = mount(
        {
          components: { DsPagination },
          data: () => ({ page }),
          template: `<DsPagination v-model:page="page" :page-count="${pageCount}" />`,
        },
        { attachTo: document.body },
      )
      const btn = (label: string) => w.get(`[aria-label="${label}"]`).element as HTMLButtonElement
      return { w, btn }
    }

    it('moves focus to Previous when Next reaches the last page and becomes disabled', async () => {
      const { w, btn } = mountReal(2, 3)
      btn('Next page').focus()

      await w.get('[aria-label="Next page"]').trigger('click')
      await flushPromises()

      expect(btn('Next page').disabled).toBe(true)
      expect(document.activeElement).toBe(btn('Previous page'))
      w.unmount()
    })

    it('moves focus to Next when Previous reaches the first page and becomes disabled', async () => {
      const { w, btn } = mountReal(2, 3)
      btn('Previous page').focus()

      await w.get('[aria-label="Previous page"]').trigger('click')
      await flushPromises()

      expect(btn('Previous page').disabled).toBe(true)
      expect(document.activeElement).toBe(btn('Next page'))
      w.unmount()
    })

    it('leaves focus where it is when the button stays enabled', async () => {
      const { w, btn } = mountReal(1, 5)
      btn('Next page').focus()

      await w.get('[aria-label="Next page"]').trigger('click')
      await flushPromises()

      expect(document.activeElement).toBe(btn('Next page'))
      w.unmount()
    })
  })
})
