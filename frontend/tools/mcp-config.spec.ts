import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { DEVTOOLS_ARGS, DEVTOOLS_MCP, mcpServers, PLAYWRIGHT_MCP } from './lib/mcp-servers.mjs'

const root = join(__dirname, '../..')

describe('MCP servers', () => {
  it('are pinned to an exact version, never latest', () => {
    for (const pkg of [PLAYWRIGHT_MCP, DEVTOOLS_MCP]) expect(pkg).toMatch(/@\d+\.\d+\.\d+$/)
  })

  it('the DevTools server keeps its profile isolated and sends nothing to Google', () => {
    expect(DEVTOOLS_ARGS).toEqual(expect.arrayContaining(['--isolated', '--no-performance-crux', '--no-usage-statistics']))
  })

  it("the project's .mcp.json is exactly what the tools and the plugin use", () => {
    expect(JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8')).mcpServers).toEqual(mcpServers())
  })

  it('both servers are approved for this project in .claude/settings.json, so Claude connects without a prompt', () => {
    expect(JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8')).enabledMcpjsonServers).toEqual([
      'playwright',
      'chrome-devtools',
    ])
  })
})
