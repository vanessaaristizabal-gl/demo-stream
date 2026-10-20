export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly body: unknown

  constructor(status: number, message: string, code?: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
  }
}

interface ApiConfig {
  getToken: () => string | null
  onUnauthorized: () => void
}

let config: ApiConfig = { getToken: () => null, onUnauthorized: () => {} }

/** Wired once at startup so the client never imports a store (avoids circular imports). */
export function configureApi(next: Partial<ApiConfig>): void {
  config = { ...config, ...next }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
}

export async function api<T>(path: string, { method = 'GET', body, headers = {} }: RequestOptions = {}): Promise<T> {
  const token = config.getToken()
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) config.onUnauthorized()
    const p = (payload ?? {}) as { message?: string; error?: string }
    throw new ApiError(response.status, p.message ?? response.statusText, p.error, payload)
  }

  return payload as T
}
