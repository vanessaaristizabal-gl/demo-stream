export interface RowMessage {
  kind: 'locked' | 'rate-limited' | 'error'
  text: string
}
