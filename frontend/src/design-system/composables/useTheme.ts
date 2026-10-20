import { ref } from 'vue'

const KEY = 'stream.theme'
const DARK_CLASS = 'app-dark'

function read(): boolean {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved === 'dark'
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

const dark = ref(read())

function apply(): void {
  document.documentElement.classList.toggle(DARK_CLASS, dark.value)
}

/** Shared dark-mode state. Persists the choice and falls back to the OS preference. */
export function useTheme() {
  function toggle(): void {
    dark.value = !dark.value
    try {
      localStorage.setItem(KEY, dark.value ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
    apply()
  }

  apply()
  return { dark, toggle }
}
