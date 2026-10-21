import { describe, expect, it } from 'vitest'
import { DEALERS } from './dealers'
import { fillTemplate } from './template'

describe('fillTemplate', () => {
  it('fills known placeholders, with or without inner spaces', () => {
    expect(fillTemplate('{{dealer.name}} / {{ dealer.city }}', DEALERS[1])).toEqual({
      text: 'Acme Motors / Austin',
      unknown: [],
      malformed: [],
    })
  })

  it('reports an unknown placeholder once and leaves it in the text instead of blanking it', () => {
    expect(fillTemplate('{{ dealer.x }} {{ dealer.x }}', DEALERS[1])).toEqual({
      text: '{{ dealer.x }} {{ dealer.x }}',
      unknown: ['dealer.x'],
      malformed: [],
    })
  })

  it.each(['{{ dealer.name }', '{{ dealer name }}', '{{ dealer.name', 'dealer.name }}', '{{ }}'])('reports %j as malformed', (template) => {
    expect(fillTemplate(template, DEALERS[1]).malformed).toHaveLength(1)
  })

  it('does not treat inherited object keys as placeholders', () => {
    expect(fillTemplate('{{ constructor }}', DEALERS[1]).unknown).toEqual(['constructor'])
  })
})
