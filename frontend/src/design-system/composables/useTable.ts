import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export interface Sort {
  key: string
  dir: 'asc' | 'desc'
}

type Cell = string | number | null | undefined

interface TableOptions<T> {
  pageSize?: number
  /** Text searched by the filter box. */
  searchText?: (row: T) => string
  /** Sort value per column key when it is not simply row[key]. */
  accessors?: Record<string, (row: T) => Cell>
  initialSort?: Sort | null
}

const compare = (a: NonNullable<Cell>, b: NonNullable<Cell>): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

/** Client-side search, sort and pagination for a table of rows. */
export function useTable<T extends object>(rows: MaybeRefOrGetter<T[]>, options: TableOptions<T> = {}) {
  const { pageSize = 10, searchText, accessors = {}, initialSort = null } = options

  const search = ref('')
  const sort = ref<Sort | null>(initialSort)
  const page = ref(1)

  const cell = (row: T, key: string): Cell => {
    const value = accessors[key] ? accessors[key](row) : ((row as Record<string, unknown>)[key] as Cell)
    return typeof value === 'number' && Number.isNaN(value) ? null : value // NaN has no order: treat it as empty
  }

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    const all = toValue(rows)
    return q && searchText ? all.filter((r) => searchText(r).toLowerCase().includes(q)) : all
  })

  const sorted = computed(() => {
    const s = sort.value
    if (!s) return filtered.value
    const sign = s.dir === 'asc' ? 1 : -1
    return [...filtered.value].sort((a, b) => {
      const x = cell(a, s.key)
      const y = cell(b, s.key)
      // Empty values go last whichever way the column is sorted; only real values flip with the direction.
      if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1
      return sign * compare(x, y)
    })
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize)))
  const pageRows = computed(() => sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize))

  // Searching or re-sorting returns to page 1; shrinking data never leaves an empty page.
  watch([search, sort], () => (page.value = 1), { deep: true }) // deep: an in-place sort.value.dir change also resets the page
  watch(pageCount, (n) => {
    if (page.value > n) page.value = n
  })

  return { search, sort, page, pageCount, pageRows, total: computed(() => sorted.value.length) }
}
