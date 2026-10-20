/**
 * Where to send someone after signing in. Only same-app paths are accepted, so a crafted
 * `?redirect=https://evil.example` or `//evil.example` can never turn the login into an open redirect.
 */
export function safeRedirect(target: unknown, fallback = '/campaigns'): string {
  if (typeof target !== 'string') return fallback
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback
  if (target === '/login' || target.startsWith('/login?')) return fallback
  return target
}
