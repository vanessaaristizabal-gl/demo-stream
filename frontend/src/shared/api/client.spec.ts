import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, configureApi } from './client'

const fetchMock = vi.fn()

function respond(status: number, body?: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(body === undefined ? null : JSON.stringify(body), { status }))
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  configureApi({ getToken: () => 'tok', onUnauthorized: () => {} })
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('sends the bearer token and JSON body', async () => {
    respond(200, { ok: true })
    await api('/x', { method: 'POST', body: { a: 1 }, headers: { 'Idempotency-Key': 'k' } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/x')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok', 'Content-Type': 'application/json', 'Idempotency-Key': 'k' })
    expect(init.body).toBe('{"a":1}')
  })

  it('omits Authorization when there is no token', async () => {
    configureApi({ getToken: () => null })
    respond(200, {})
    await api('/x')
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('returns undefined on 204', async () => {
    respond(204)
    expect(await api('/logout', { method: 'POST' })).toBeUndefined()
  })

  it('throws ApiError carrying status, code and message', async () => {
    respond(423, { error: 'emergency_stop', message: 'Stopped' })

    await expect(api('/x')).rejects.toMatchObject({ name: 'ApiError', status: 423, code: 'emergency_stop', message: 'Stopped' })
    respond(500, null)
    await expect(api('/x')).rejects.toBeInstanceOf(ApiError)
  })

  it('notifies on 401', async () => {
    const onUnauthorized = vi.fn()
    configureApi({ onUnauthorized })
    respond(401, { message: 'Unauthenticated.' })

    await expect(api('/me')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
