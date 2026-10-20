import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeChangeRequest } from '@/shared/test/factories'
import ChangeRequestCard from './ChangeRequestCard.vue'

describe('ChangeRequestCard', () => {
  it('emits approve and reject with the request id', async () => {
    const w = mount(ChangeRequestCard, { props: { request: makeChangeRequest({ id: 42 }), canDecide: true } })

    await w
      .findAll('button')
      .find((b) => b.text() === 'Approve')!
      .trigger('click')
    await w
      .findAll('button')
      .find((b) => b.text() === 'Reject')!
      .trigger('click')

    expect(w.emitted('approve')).toEqual([[42]])
    expect(w.emitted('reject')).toEqual([[42]])
  })

  it('hides decisions from users who cannot decide', () => {
    const w = mount(ChangeRequestCard, { props: { request: makeChangeRequest(), canDecide: false } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('hides decisions once the request is no longer pending', () => {
    const w = mount(ChangeRequestCard, { props: { request: makeChangeRequest({ status: 'applied' }), canDecide: true } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('lists the manufacturer rules that blocked it', () => {
    const request = makeChangeRequest({
      status: 'blocked',
      failure: { violations: [{ rule_id: 'TOY-001', message: 'Daily budget cannot exceed $500.' }] },
    })
    const w = mount(ChangeRequestCard, { props: { request, canDecide: true } })

    expect(w.get('[aria-label="Rule violations"]').text()).toContain('TOY-001: Daily budget cannot exceed $500.')
    expect(w.find('[role="alert"]').exists()).toBe(true)
  })
})
