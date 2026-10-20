import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useTable } from './useTable'

interface Row {
  id: number
  name: string
  budget: number | null
}
const rows: Row[] = [
  { id: 1, name: 'Camry 10', budget: 300 },
  { id: 2, name: 'camry 2', budget: 100 },
  { id: 3, name: 'RAV4', budget: null },
  { id: 4, name: 'Accord', budget: 200 },
]
const ids = (r: Row[]) => r.map((x) => x.id)

describe('useTable', () => {
  it('sorts text naturally and case-insensitively, asc then desc', () => {
    const t = useTable(rows)

    t.sort.value = { key: 'name', dir: 'asc' }
    expect(ids(t.pageRows.value)).toEqual([4, 2, 1, 3]) // Accord, camry 2, Camry 10, RAV4

    t.sort.value = { key: 'name', dir: 'desc' }
    expect(ids(t.pageRows.value)).toEqual([3, 1, 2, 4])
  })

  it('sorts numbers numerically and always puts empty values last', () => {
    const t = useTable(rows)

    t.sort.value = { key: 'budget', dir: 'asc' }
    expect(ids(t.pageRows.value)).toEqual([2, 4, 1, 3])
    t.sort.value = { key: 'budget', dir: 'desc' }
    expect(ids(t.pageRows.value)).toEqual([1, 4, 2, 3])
  })

  it('uses a column accessor when the value is not row[key]', () => {
    const t = useTable(rows, { accessors: { len: (r) => r.name.length } })

    t.sort.value = { key: 'len', dir: 'asc' }
    expect(t.pageRows.value[0].name).toBe('RAV4')
  })

  it('filters by search text and reports the filtered total', () => {
    const t = useTable(rows, { searchText: (r) => r.name })

    t.search.value = ' CAMRY '
    expect(ids(t.pageRows.value)).toEqual([1, 2])
    expect(t.total.value).toBe(2)
  })

  it('paginates and returns to page 1 when searching or sorting', async () => {
    const t = useTable(rows, { pageSize: 2, searchText: (r) => r.name })
    expect(t.pageCount.value).toBe(2)

    t.page.value = 2
    expect(ids(t.pageRows.value)).toEqual([3, 4])

    t.search.value = 'a'
    await nextTick()
    expect(t.page.value).toBe(1)

    t.page.value = 2
    t.sort.value = { key: 'name', dir: 'asc' }
    await nextTick()
    expect(t.page.value).toBe(1)
  })

  it('never leaves an empty page when the data shrinks', async () => {
    const data = ref(rows)
    const t = useTable(data, { pageSize: 2 })
    t.page.value = 2

    data.value = rows.slice(0, 1)
    await nextTick()

    expect(t.page.value).toBe(1)
    expect(t.pageRows.value).toHaveLength(1)
  })

  it('does not mutate the source array when sorting', () => {
    const source = [...rows]
    const t = useTable(source)

    t.sort.value = { key: 'budget', dir: 'desc' }
    void t.pageRows.value

    expect(source).toEqual(rows)
  })

  it('always has at least one page', () => {
    expect(useTable<Row>([]).pageCount.value).toBe(1)
  })

  it('resets to page 1 when the sort object is changed in place, not only replaced', async () => {
    const t = useTable(rows, { pageSize: 2, initialSort: { key: 'name', dir: 'asc' } })
    t.page.value = 2

    t.sort.value!.dir = 'desc'
    await nextTick()

    expect(t.page.value).toBe(1)
  })

  it('treats NaN like an empty value: sorted last in both directions, never scrambling the order', () => {
    const data = [
      { id: 1, n: 5 },
      { id: 2, n: Number.NaN },
      { id: 3, n: 1 },
    ]
    const t = useTable(data)

    t.sort.value = { key: 'n', dir: 'asc' }
    expect(t.pageRows.value.map((r) => r.id)).toEqual([3, 1, 2])
    t.sort.value = { key: 'n', dir: 'desc' }
    expect(t.pageRows.value.map((r) => r.id)).toEqual([1, 3, 2])
  })
})
