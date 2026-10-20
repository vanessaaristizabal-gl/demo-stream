<script setup lang="ts" generic="T extends object">
import { computed, useId } from 'vue'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-vue-next'
import type { Sort } from '../composables/useTable'

export interface DsColumn {
  key: string
  label: string
  sortable?: boolean
  align?: 'start' | 'end'
}

const props = defineProps<{ columns: DsColumn[]; rows: T[]; rowKey: keyof T & string; caption: string }>()
const sort = defineModel<Sort | null>('sort', { default: null })

defineSlots<
  {
    empty?: () => unknown
  } & Record<string, ((p: { row: T; value: unknown }) => unknown) | undefined>
>()

const captionId = useId()

const cellValue = (row: T, key: string): unknown => (row as Record<string, unknown>)[key]

function ariaSort(col: DsColumn): 'ascending' | 'descending' | 'none' | undefined {
  if (!col.sortable) return undefined
  return sort.value?.key === col.key ? (sort.value.dir === 'asc' ? 'ascending' : 'descending') : 'none'
}

function toggleSort(key: string): void {
  const current = sort.value
  if (current?.key !== key) sort.value = { key, dir: 'asc' }
  else if (current.dir === 'asc') sort.value = { key, dir: 'desc' }
  else sort.value = null
}

const colCount = computed(() => props.columns.length)
// The wrapper is the keyboard-focusable scroll container: wide tables scroll inside it, never the page (WCAG 1.4.10).
</script>

<template>
  <div class="ds-table-wrap" role="region" :aria-labelledby="captionId" tabindex="0">
    <table class="ds-table">
      <caption :id="captionId" class="ds-sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col" :aria-sort="ariaSort(col)" :class="`ds-table__th--${col.align ?? 'start'}`">
            <button v-if="col.sortable" type="button" class="ds-table__sort" @click="toggleSort(col.key)">
              {{ col.label }}
              <ArrowUp v-if="sort?.key === col.key && sort.dir === 'asc'" aria-hidden="true" :size="14" />
              <ArrowDown v-else-if="sort?.key === col.key" aria-hidden="true" :size="14" />
              <ChevronsUpDown v-else aria-hidden="true" :size="14" class="ds-table__sort-idle" />
            </button>
            <template v-else>{{ col.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="String(row[rowKey])">
          <td v-for="col in columns" :key="col.key" :class="`ds-table__td--${col.align ?? 'start'}`">
            <slot :name="`cell-${col.key}`" :row="row" :value="cellValue(row, col.key)">{{ cellValue(row, col.key) ?? '—' }}</slot>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="colCount" class="ds-table__empty"><slot name="empty">No data.</slot></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.ds-table-wrap {
  overflow-x: auto;
}
.ds-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--ds-font-size-sm);
}
th,
td {
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  text-align: start;
  white-space: nowrap;
}
th {
  background: var(--ds-color-bg-subtle);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: var(--ds-font-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-muted);
}
.ds-table__th--end,
.ds-table__td--end {
  text-align: end;
}
tbody tr:hover {
  background: var(--ds-color-bg-hover);
}
.ds-table__sort {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  min-height: var(--ds-size-target-min);
  padding: 0;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}
.ds-table__sort:hover {
  color: var(--ds-color-text-default);
}
.ds-table__sort-idle {
  opacity: 0.6;
}
.ds-table__empty {
  padding: var(--ds-space-8) var(--ds-space-4);
  text-align: center;
  color: var(--ds-color-text-muted);
  white-space: normal;
}
</style>
