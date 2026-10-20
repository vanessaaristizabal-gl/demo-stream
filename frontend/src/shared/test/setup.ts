import { config } from '@vue/test-utils'
import { afterEach } from 'vitest'

// jsdom has no matchMedia; useTheme reads it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

config.global.stubs = { RouterLink: { template: '<a><slot /></a>' } }

afterEach(() => {
  localStorage.clear()
})
