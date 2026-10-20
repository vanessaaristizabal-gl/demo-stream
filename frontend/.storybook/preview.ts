import { setup, type Preview } from '@storybook/vue3-vite'
import { createMemoryHistory, createRouter } from 'vue-router'
import '@fontsource-variable/inter'
import '../src/design-system/tokens/tokens.css'
import '../src/design-system/base.css'

// Stories that render RouterLink (the header, the page nav) need a router; memory history keeps it self-contained.
setup((app) => {
  const stub = { template: '<div />' }
  app.use(
    createRouter({
      history: createMemoryHistory(),
      routes: ['campaigns', 'approvals', 'changelog'].map((name) => ({ path: `/${name}`, name, component: stub })),
    }),
  )
})

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: { title: 'Theme', icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      // Same switch the app uses (useTheme): the .app-dark class on <html> flips every token.
      document.documentElement.classList.toggle('app-dark', context.globals.theme === 'dark')
      return { components: { story }, template: '<div style="padding: 1rem"><story /></div>' }
    },
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
    backgrounds: { disabled: true },
  },
}

export default preview
