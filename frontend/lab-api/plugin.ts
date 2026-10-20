import type { IncomingMessage } from 'node:http'
import type { Plugin } from 'vite'
import { createLabApi } from './handler.ts'

const PREFIX = '/api/lab'

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return Symbol.for('invalid-json')
  }
}

/** Serves the practice lab's mock backend on `/api/lab/*` in `vite dev` (before the Laravel proxy). Never part of a build. */
export function labApi(): Plugin {
  const lab = createLabApi()
  return {
    name: 'stream-lab-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) return next()

        const body = await readJson(req)
        const response =
          typeof body === 'symbol'
            ? { status: 400, body: { error: 'invalid_json', message: 'The request body is not valid JSON.' }, headers: undefined }
            : lab.handle({
                method: req.method ?? 'GET',
                path: url.pathname.slice(PREFIX.length) || '/',
                query: url.searchParams,
                headers: req.headers as Record<string, string | undefined>,
                body,
              })

        res.statusCode = response.status
        for (const [name, value] of Object.entries(response.headers ?? {})) res.setHeader(name, value)
        if (response.status === 204) return void res.end()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(response.body))
      })
    },
  }
}
