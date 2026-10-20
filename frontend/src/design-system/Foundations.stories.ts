import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { primitives, semanticColors } from './tokens/tokens'

// Documentation generated from the same tokens the components use. Switch the Theme toolbar to compare light and dark.
const meta = { title: 'Foundations/Tokens', parameters: { layout: 'padded' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const groups = (() => {
  const out: Record<string, string[]> = {}
  for (const name of Object.keys(semanticColors.light)) {
    const group = name.split('.').slice(1, -1).join('.') || name.split('.')[1]
    ;(out[group.split('.')[0]] ??= []).push(name)
  }
  return out
})()

export const Colors: Story = {
  render: () => ({
    setup: () => ({ groups, light: semanticColors.light, dark: semanticColors.dark }),
    template: `
      <div class="ds-stack" style="gap: var(--ds-space-8)">
        <p class="ds-muted">Semantic color tokens. Components use these, never raw values. The swatch shows the active theme; the hex shows light / dark.</p>
        <section v-for="(names, group) in groups" :key="group" class="ds-stack">
          <h2 style="text-transform: capitalize">{{ group }}</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: var(--ds-space-3)">
            <div v-for="n in names" :key="n" style="display: flex; gap: var(--ds-space-3); align-items: center">
              <span :style="{ background: 'var(--ds-' + n.replace(/\\./g, '-') + ')' }" style="flex: none; width: 3rem; height: 3rem; border: 1px solid var(--ds-color-border-strong); border-radius: var(--ds-radius-md)" />
              <div style="min-width: 0; font-size: var(--ds-font-size-sm)">
                <div style="font-weight: var(--ds-font-weight-semibold)">{{ n.replace('color.', '') }}</div>
                <code style="font-family: var(--ds-font-family-mono); font-size: var(--ds-font-size-xs)" class="ds-muted">{{ light[n] }} / {{ dark[n] }}</code>
              </div>
            </div>
          </div>
        </section>
      </div>`,
  }),
}

export const Palette: Story = {
  render: () => ({
    setup() {
      const scales: Record<string, [string, string][]> = {}
      for (const [k, v] of Object.entries(primitives)) {
        const m = k.match(/^color\.(\w+)\.(\d+)$/)
        if (m) (scales[m[1]] ??= []).push([m[2], v])
      }
      return { scales }
    },
    template: `
      <div class="ds-stack">
        <p class="ds-muted">Primitive scales. Only the semantic layer references these.</p>
        <div v-for="(steps, name) in scales" :key="name" class="ds-stack" style="gap: var(--ds-space-2)">
          <h3 style="text-transform: capitalize">{{ name }}</h3>
          <div style="display: flex; flex-wrap: wrap">
            <div v-for="[step, hex] in steps" :key="step" style="width: 4.5rem; font-size: var(--ds-font-size-xs)">
              <div :style="{ background: hex }" style="height: 2.5rem; border: 1px solid var(--ds-color-border-default)" />
              <div style="font-weight: var(--ds-font-weight-semibold)">{{ step }}</div>
              <div class="ds-muted">{{ hex }}</div>
            </div>
          </div>
        </div>
      </div>`,
  }),
}

export const Typography: Story = {
  render: () => ({
    setup: () => ({
      sizes: ['4xl', '3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'],
      weights: ['regular', 'medium', 'semibold', 'bold'],
    }),
    template: `
      <div class="ds-stack" style="gap: var(--ds-space-6)">
        <section class="ds-stack" style="gap: var(--ds-space-2)">
          <h2>Type scale</h2>
          <div v-for="s in sizes" :key="s" style="display: flex; gap: var(--ds-space-4); align-items: baseline">
            <code class="ds-muted" style="width: 4rem; font-family: var(--ds-font-family-mono); font-size: var(--ds-font-size-xs)">{{ s }}</code>
            <span :style="{ fontSize: 'var(--ds-font-size-' + s + ')' }">Every change is approved and recorded</span>
          </div>
        </section>
        <section class="ds-stack" style="gap: var(--ds-space-2)">
          <h2>Weights</h2>
          <div v-for="w in weights" :key="w" :style="{ fontWeight: 'var(--ds-font-weight-' + w + ')' }">{{ w }}: Campaign operations platform</div>
        </section>
        <section class="ds-stack" style="gap: var(--ds-space-2)">
          <h2>Families</h2>
          <p style="font-family: var(--ds-font-family-sans)">Sans: Inter Variable, with a system fallback</p>
          <p style="font-family: var(--ds-font-family-mono)">Mono: 1234567890 daily_budget</p>
        </section>
      </div>`,
  }),
}

export const SpacingAndShape: Story = {
  render: () => ({
    setup: () => ({
      spaces: ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16'],
      radii: ['sm', 'md', 'lg', 'full'],
      shadows: ['sm', 'md', 'lg'],
    }),
    template: `
      <div class="ds-stack" style="gap: var(--ds-space-6)">
        <section class="ds-stack" style="gap: var(--ds-space-2)">
          <h2>Spacing</h2>
          <div v-for="s in spaces" :key="s" style="display: flex; gap: var(--ds-space-3); align-items: center">
            <code class="ds-muted" style="width: 3rem; font-family: var(--ds-font-family-mono); font-size: var(--ds-font-size-xs)">space-{{ s }}</code>
            <span :style="{ width: 'var(--ds-space-' + s + ')' }" style="height: 1rem; background: var(--ds-color-action-primary-bg); border-radius: var(--ds-radius-sm)" />
          </div>
        </section>
        <section class="ds-stack" style="gap: var(--ds-space-2)">
          <h2>Radius</h2>
          <div class="ds-row">
            <div v-for="r in radii" :key="r" :style="{ borderRadius: 'var(--ds-radius-' + r + ')' }" style="display: grid; place-items: center; width: 5rem; height: 5rem; background: var(--ds-color-bg-subtle); border: 1px solid var(--ds-color-border-strong); font-size: var(--ds-font-size-xs)">{{ r }}</div>
          </div>
        </section>
        <section class="ds-stack" style="gap: var(--ds-space-2)">
          <h2>Elevation</h2>
          <div class="ds-row" style="gap: var(--ds-space-6)">
            <div v-for="s in shadows" :key="s" :style="{ boxShadow: 'var(--ds-shadow-' + s + ')' }" style="display: grid; place-items: center; width: 6rem; height: 4rem; background: var(--ds-color-bg-surface); border-radius: var(--ds-radius-md); font-size: var(--ds-font-size-xs)">{{ s }}</div>
          </div>
        </section>
      </div>`,
  }),
}
