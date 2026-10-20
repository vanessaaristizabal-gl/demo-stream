/** "12.5" or "$1,250.00" to integer cents; null when it is not a valid budget (empty, under $1.00, or more than two decimals). */
export function parseDollarsToCents(text: string): number | null {
  const clean = text.trim().replace(/^\$/, '')
  if (!/^(\d{1,7}|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(clean)) return null // grouping must be real thousands; at most $9,999,999.99
  const cents = Math.round(Number(clean.replace(/,/g, '')) * 100)
  return cents >= 100 ? cents : null
}
