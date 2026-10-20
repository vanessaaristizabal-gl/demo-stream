import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from './useTheme'

beforeEach(() => document.documentElement.classList.remove('app-dark'))

describe('useTheme', () => {
  it('toggles the dark class on <html> and persists the choice', () => {
    const { dark, toggle } = useTheme()
    const start = dark.value

    toggle()

    expect(dark.value).toBe(!start)
    expect(document.documentElement.classList.contains('app-dark')).toBe(!start)
    expect(localStorage.getItem('stream.theme')).toBe(!start ? 'dark' : 'light')

    toggle()
    expect(dark.value).toBe(start)
  })
})
