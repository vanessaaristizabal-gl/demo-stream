// A minimal MCP client over stdio (newline-delimited JSON-RPC), enough to drive one MCP server from a script.
import { spawn } from 'node:child_process'

export function startMcp(command, args, { onStderr } = {}) {
  const child = spawn(command, args, { stdio: ['pipe', 'pipe', onStderr ? 'pipe' : 'ignore'] })
  if (onStderr) child.stderr.on('data', onStderr)
  let buffer = ''
  let nextId = 0
  const waiting = new Map()

  child.stdout.on('data', (chunk) => {
    buffer += chunk
    let newline
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline)
      buffer = buffer.slice(newline + 1)
      try {
        const message = JSON.parse(line)
        waiting.get(message.id)?.(message)
      } catch {
        // not JSON (a banner on stdout): ignore
      }
    }
  })

  const rpc = (method, params) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      waiting.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)))
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    })

  return {
    async initialize() {
      await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'stream-audit', version: '1.0.0' } })
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    },
    /** Calls a tool and returns its text content. */
    async call(name, args) {
      const result = await rpc('tools/call', { name, arguments: args })
      const text = (result.content ?? []).map((c) => c.text ?? '').join('\n')
      if (result.isError) throw new Error(`${name}: ${text}`)
      return text
    },
    close() {
      child.kill()
    },
  }
}
