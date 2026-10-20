import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { DEALERS } from '../dealers'
import { fillTemplate, TEMPLATE_LIMIT } from '../template'
import TemplateField from './TemplateField.vue'

const render = (modelValue = '', dealerId = 'acme') =>
  mount(TemplateField, { props: { modelValue, dealerId, dealers: DEALERS }, attachTo: document.body })
const input = (w: ReturnType<typeof render>) => w.get('input[type="text"]')
const count = (w: ReturnType<typeof render>) => w.get('p.count').text()

describe('TemplateField', () => {
  it('AC-1: the field has a visible label and shows the filled-in character count out of 30', () => {
    const w = render('{{ dealer.name }} deals')
    expect(w.get(`label[for="${input(w).attributes('id')}"]`).text()).toBe('Ad headline template')
    expect(count(w)).toBe('17 / 30 characters for Acme Motors')
  })

  it('AC-2: the preview replaces every placeholder with the selected dealer value', () => {
    const w = render('{{ dealer.name }} in {{ dealer.city }}')
    expect(w.get('p.preview').text()).toBe('Acme Motors in Austin')
  })

  it('AC-3: changing the dealer recalculates the preview and the count', async () => {
    const w = render('{{ dealer.name }}')
    await w.setProps({ dealerId: 'riverside' })
    expect(w.get('p.preview').text()).toBe('Riverside Honda of Springfield')
    expect(count(w)).toBe('30 / 30 characters for Riverside Honda of Springfield')
  })

  it('AC-4: over the limit the field is invalid and the error says by how many characters', () => {
    const w = render('{{ dealer.name }} - 0% APR this month!')
    expect(input(w).attributes('aria-invalid')).toBe('true')
    expect(w.get('[role="alert"]').text()).toBe('2 characters over the 30 character limit')
  })

  it('AC-5: the count is a status message and the error is associated with the field', () => {
    const w = render('{{ dealer.name }} - 0% APR this month!')
    expect(w.get('p.count').attributes('role')).toBe('status')
    const errorId = w.get('[role="alert"]').attributes('id')
    expect(input(w).attributes('aria-describedby')).toContain(errorId)
  })

  it('AC-6: an unknown placeholder is reported by name and the preview is marked as a draft', () => {
    const w = render('{{ dealer.nme }}')
    expect(w.get('[role="alert"]').text()).toBe('Unknown placeholder: dealer.nme')
    expect(w.text()).toContain('Draft: fix the placeholders first')
    expect(w.get('p.preview').text()).toBe('{{ dealer.nme }}')
  })

  it('AC-7: lists every dealer for which the filled-in text would be too long', () => {
    const w = render('{{ dealer.name }} 0% APR')
    const warning = w.get('[role="status"]:not(p)').text()
    expect(warning).toContain('Too long for 2 dealers')
    expect(warning).toContain('Riverside Honda of Springfield (')
    expect(warning).toContain('Bayview Chevrolet Buick GMC (')
    expect(warning).not.toContain('Acme Motors')
  })

  it('AC-8: an empty template shows a hint and no error', () => {
    const w = render('')
    expect(w.text()).toContain('Type a template to see how it reads for each dealer.')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('AC-9: exactly 30 filled-in characters is valid and 31 is not', () => {
    const exact = render('x'.repeat(TEMPLATE_LIMIT))
    expect(exact.find('[role="alert"]').exists()).toBe(false)
    const over = render('x'.repeat(TEMPLATE_LIMIT + 1))
    expect(over.get('[role="alert"]').text()).toBe('1 character over the 30 character limit')
  })

  it('AC-10: a placeholder used twice is counted twice', () => {
    const w = render('{{ dealer.name }}{{ dealer.name }}')
    expect(count(w)).toBe('22 / 30 characters for Acme Motors')
    expect(fillTemplate('{{dealer.name}}{{ dealer.name }}', DEALERS[1]).text).toBe('Acme MotorsAcme Motors')
  })

  it('AC-12: a malformed placeholder is reported and the preview stays a draft', () => {
    const w = render('{{ dealer.name } - 0% APR')
    expect(w.get('[role="alert"]').text()).toBe('Malformed placeholder: {{ dealer.name }')
    expect(w.text()).toContain('Draft: fix the placeholders first')
  })

  it('AC-13: a whitespace-only template is empty: a hint and no error', () => {
    const w = render(' '.repeat(40))
    expect(w.text()).toContain('Type a template to see how it reads for each dealer.')
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('AC-11: typed text is rendered as plain text, never as HTML', async () => {
    const w = render('<img src=x onerror=alert(1)>')
    expect(w.find('p.preview img').exists()).toBe(false)
    expect(w.get('p.preview').text()).toBe('<img src=x onerror=alert(1)>')
    await expectNoA11yViolations(w)
  })
})
