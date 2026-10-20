#!/usr/bin/env node
// Usage:
//   node new-component.mjs DsBadge --ds                   -> src/design-system/components (name must start with Ds; added to the barrel)
//   node new-component.mjs LockBadge --feature campaigns  -> src/features/campaigns/components
//   node new-component.mjs DateRange --shared             -> src/shared/components
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FEATURES = ['auth', 'campaigns', 'approvals', 'changelog', 'system']
const [name, flag, value] = process.argv.slice(2)

const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}

if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) fail('Usage: new-component.mjs <PascalCaseName> (--ds | --feature <name> | --shared)')

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../frontend/src')
let dir, title, importSource
if (flag === '--ds') {
  if (!name.startsWith('Ds')) fail('Design-system components must be named Ds<Something> (for example DsBadge).')
  dir = join(src, 'design-system/components')
  title = `Design System/${name.slice(2)}`
} else if (flag === '--feature') {
  if (!FEATURES.includes(value)) fail(`Unknown feature "${value}". Features: ${FEATURES.join(', ')}`)
  dir = join(src, `features/${value}/components`)
  title = `Features/${value[0].toUpperCase()}${value.slice(1)}/${name}`
} else if (flag === '--shared') {
  dir = join(src, 'shared/components')
  title = `Shared/${name}`
} else fail('Say where it lives: --ds, --feature <name> or --shared.')

const ds = flag === '--ds'
importSource = ds ? "import type { Component } from 'vue'\n" : ''

const files = {
  [`${name}.vue`]: `<script setup lang="ts">
// Presentational: props in, events out. No stores, no API calls.
defineProps<{ label: string }>()
const emit = defineEmits<{ select: [label: string] }>()
</script>

<template>
  <button type="button" @click="emit('select', label)">{{ label }}</button>
</template>
${ds ? `
<style scoped>
/* Semantic tokens only: var(--ds-color-*), --ds-space-*, --ds-radius-*, --ds-font-size-*. No raw hex. */
</style>
` : ''}`,
  [`${name}.spec.ts`]: `import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ${name} from './${name}.vue'

describe('${name}', () => {
  it('renders its label and emits select with it', async () => {
    const w = mount(${name}, { props: { label: 'Hello' } })

    expect(w.text()).toBe('Hello')
    await w.get('button').trigger('click')
    expect(w.emitted('select')).toEqual([['Hello']])
  })
})
`,
  [`${name}.stories.ts`]: `import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import ${name} from './${name}.vue'

const meta = {
  title: '${title}',
  component: ${name},
  args: { label: 'Hello', onSelect: fn() },
} satisfies Meta<typeof ${name}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
`,
}
void importSource

const clashes = Object.keys(files).filter((f) => existsSync(join(dir, f)))
if (clashes.length) fail(`Refusing to overwrite: ${clashes.join(', ')}`)

mkdirSync(dir, { recursive: true })
for (const [file, content] of Object.entries(files)) {
  writeFileSync(join(dir, file), content)
  console.log(`created ${join(dir, file).replace(src, 'frontend/src')}`)
}

if (ds) {
  const barrel = join(src, 'design-system/index.ts')
  if (!readFileSync(barrel, 'utf8').includes(`./components/${name}.vue`)) {
    appendFileSync(barrel, `export { default as ${name} } from './components/${name}.vue'\n`)
    console.log('added to frontend/src/design-system/index.ts (keep the exports sorted)')
  }
}
