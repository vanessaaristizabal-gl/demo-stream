// The MCP servers the front-end workflow uses, pinned (never "latest") and free: no account, key or paid plan.
export const PLAYWRIGHT_MCP = '@playwright/mcp@0.0.83' // Apache-2.0: drives the app like a person, drafts end-to-end tests

export const DEVTOOLS_MCP = 'chrome-devtools-mcp@1.11.0' // Apache-2.0: Chrome DevTools for agents (accessibility tree, Lighthouse, traces)
// Isolated profile, no URLs sent to the CrUX API, no usage statistics, no file: navigation.
export const DEVTOOLS_ARGS = ['--isolated', '--no-performance-crux', '--no-usage-statistics', '--no-file-navigations']

/** The `mcpServers` block shared by the project's .mcp.json and the plugin. */
export const mcpServers = () => ({
  playwright: { command: 'npx', args: [PLAYWRIGHT_MCP] },
  'chrome-devtools': { command: 'npx', args: [DEVTOOLS_MCP, ...DEVTOOLS_ARGS] },
})
