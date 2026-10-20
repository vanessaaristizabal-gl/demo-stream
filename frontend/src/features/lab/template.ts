import type { LabDealer } from '@/shared/api/types'

export const TEMPLATE_LIMIT = 30

export interface FilledTemplate {
  text: string
  /** Placeholders that do not exist. Their text is left in place, so the preview never pretends to be final. */
  unknown: string[]
  /** Leftover braces that are not a well-formed placeholder, such as `{{ dealer.name }`. */
  malformed: string[]
}

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g

/** Fills `{{ dealer.name }}`-style placeholders. Strict: an unknown placeholder is reported, never replaced by a blank. */
export function fillTemplate(template: string, dealer: LabDealer | undefined): FilledTemplate {
  const values: Record<string, string> = { 'dealer.name': dealer?.name ?? '', 'dealer.city': dealer?.city ?? '' }
  const unknown: string[] = []
  const text = template.replace(PLACEHOLDER, (whole, path: string) => {
    if (Object.hasOwn(values, path)) return values[path]
    if (!unknown.includes(path)) unknown.push(path)
    return whole
  })
  const malformed = [...template.replace(PLACEHOLDER, ' ').matchAll(/\{\{?[^{}]*\}?\}?|\}\}?/g)]
    .map((m) => m[0].trim())
    .filter((m) => m.includes('{') || m.includes('}'))
  return { text, unknown, malformed }
}
