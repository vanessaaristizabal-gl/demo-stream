import type { Dealer } from '@/shared/api/types'

/** Sample dealers with short and long names, so the 30 character limit bites for some and not for others. */
export const DEALERS: Dealer[] = [
  { id: 'peak', name: 'Peak Subaru', city: 'Denver' },
  { id: 'acme', name: 'Acme Motors', city: 'Austin' },
  { id: 'lakeside', name: 'Lakeside Toyota', city: 'Chicago' },
  { id: 'riverside', name: 'Riverside Honda of Springfield', city: 'Springfield' },
  { id: 'bayview', name: 'Bayview Chevrolet Buick GMC', city: 'San Diego' },
]
