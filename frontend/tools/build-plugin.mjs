#!/usr/bin/env node
// Packages the front-end setup as one installable plugin: the skills, the reviewer agents, the hooks and the Playwright and Chrome DevTools MCP servers.
// A plugin does not load CLAUDE.md or .claude/rules/, so the conventions travel as skills generated from those rules.
// The repo's .claude/ stays the single source of truth; the plugin folder is generated from it (never edited by hand).
//   node tools/build-plugin.mjs [outDir]      default: ../plugins/stream-frontend-kit
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DEVTOOLS_MCP, mcpServers, PLAYWRIGHT_MCP } from './lib/mcp-servers.mjs'
import { fileURLToPath } from 'node:url'
import { realpathSync as realPath } from 'node:fs'

// Compare real paths: a symlinked folder (macOS /var vs /private/var, a plugin cache) must not stop the CLI from running.
const isMain = () => process.argv[1] !== undefined && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '..')
const repo = resolve(frontend, '..')

export const PLUGIN_NAME = 'stream-frontend-kit'
export { PLAYWRIGHT_MCP }

/** Pure: the body of a Markdown file without its front matter. */
export function stripFrontMatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
}

export function buildPlugin(out = join(repo, 'plugins', PLUGIN_NAME)) {
  rmSync(out, { recursive: true, force: true })
  for (const dir of ['.claude-plugin', 'skills', 'agents', 'hooks', 'scripts']) mkdirSync(join(out, dir), { recursive: true })

  // Skills copied as they are (the scaffold script is told where it lives once installed).
  for (const skill of ['screen-from-spec', 'design-language', 'create-vue-component', 'create-pinia-store'])
    cpSync(join(repo, '.claude/skills', skill), join(out, 'skills', skill), { recursive: true })
  const scaffold = join(out, 'skills/create-vue-component/SKILL.md')
  const SCRIPTS = '.claude/skills/create-vue-component/scripts/'
  writeFileSync(
    scaffold,
    readFileSync(scaffold, 'utf8').replaceAll(`node ${SCRIPTS}`, 'node ${CLAUDE_PLUGIN_ROOT}/skills/create-vue-component/scripts/'),
  )

  // Conventions that live in .claude/rules/ in the repo become skills the plugin carries.
  const rule = (name) => stripFrontMatter(readFileSync(join(repo, '.claude/rules', `${name}.md`), 'utf8')).trim()
  const skillFromRules = (name, description, rules) => {
    mkdirSync(join(out, 'skills', name), { recursive: true })
    const body = rules.map((r) => rule(r)).join('\n\n---\n\n')
    writeFileSync(join(out, 'skills', name, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}\n`)
  }
  skillFromRules(
    'frontend-conventions',
    "The Stream front end's rules in one place: TypeScript, UI library and dependency policy, CSS tokens, HTML and accessibility, dates and money formats, and how tests are written. Load before writing or reviewing front-end code; the reviewer agents read it.",
    ['typescript', 'ui-library', 'css', 'html-accessibility', 'dates-and-formats', 'frontend-testing'],
  )
  skillFromRules(
    'ux-information-design',
    'UX and information design for screens: when to use tabs, accordions or a wizard, navigation and URL state, never hiding errors, performance of what is mounted, consistency. Load before designing or reviewing how a page is organised.',
    ['ux-information-design'],
  )

  // Reviewer agents: the repo's rules are skills here, so the agents are told where to read them.
  const pluginNote =
    "\n\n## Running from the plugin\nThis agent is installed from a plugin, so the repo's `.claude/rules/` and `docs/standards/` may not exist. Read the plugin's skills instead (`frontend-conventions`, `design-language`, `ux-information-design`: find their SKILL.md with Glob `**/skills/<name>/SKILL.md`). Use the project's own docs and specs when they exist.\n"
  for (const agent of ['screen-reviewer', 'frontend-code-reviewer', 'a11y-reviewer'])
    writeFileSync(
      join(out, 'agents', `${agent}.md`),
      readFileSync(join(repo, '.claude/agents', `${agent}.md`), 'utf8').trimEnd() + pluginNote,
    )
  for (const hook of ['guard-files.mjs', 'verify.mjs']) cpSync(join(repo, '.claude/hooks', hook), join(out, 'hooks', hook))
  cpSync(join(frontend, 'tools/screen-lint.mjs'), join(out, 'scripts/screen-lint.mjs'))

  const manifest = {
    name: PLUGIN_NAME,
    version: '0.2.0',
    description:
      'Front-end workflow for Vue 3 screens: skills to build components, stores and screens from a spec, the conventions, design language and UX rules as skills, read-only reviewers (screen, front-end code, accessibility), hooks that verify every edit and block secrets files, and the Playwright and Chrome DevTools MCP servers.',
    author: { name: 'Vanessa Aristizabal' },
    license: 'MIT',
    keywords: ['vue', 'frontend', 'accessibility', 'design-system', 'review'],
  }
  writeFileSync(join(out, '.claude-plugin/plugin.json'), JSON.stringify(manifest, null, 2) + '\n')

  const hooks = {
    hooks: {
      PreToolUse: [
        { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/guard-files.mjs"' }] },
      ],
      PostToolUse: [
        { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/verify.mjs"' }] },
      ],
    },
  }
  writeFileSync(join(out, 'hooks/hooks.json'), JSON.stringify(hooks, null, 2) + '\n')
  writeFileSync(join(out, '.mcp.json'), JSON.stringify({ mcpServers: mcpServers() }, null, 2) + '\n')

  writeFileSync(
    join(out, 'README.md'),
    `# ${PLUGIN_NAME}

Generated by \`frontend/tools/build-plugin.mjs\` from the repo's \`.claude/\`. Do not edit by hand: change the source and rebuild.

| Piece | What it does |
|---|---|
| skill \`screen-from-spec\` | spec with acceptance criteria to component, states, one test per criterion, one story per state, then the reviewer |
| skill \`create-vue-component\` | scaffold a component, its spec and its stories in the right layer (design system, feature or shared) |
| skill \`create-pinia-store\` | a typed setup store with a spec that mocks the API client |
| skill \`design-language\` | tokens, base components, required states, accessibility and security rules |
| skill \`frontend-conventions\` | TypeScript, UI library, CSS, HTML and accessibility, formats and testing rules (generated from the repo's \`.claude/rules/\`, which a plugin does not load) |
| skill \`ux-information-design\` | tabs, accordions and wizards, navigation and URL state, nothing important hidden, performance of what is mounted |
| agent \`screen-reviewer\` | read-only review of a screen against its spec and the design language |
| agent \`frontend-code-reviewer\` | read-only review of front-end code: Google TypeScript style, Vue style guide and Composition API, Pinia, tests, performance, security |
| agent \`a11y-reviewer\` | read-only WCAG 2.2 AA review: axe, the DevTools accessibility tree, Lighthouse, focus and keyboard |
| hook \`guard-files\` | blocks edits to environment and secrets files |
| hook \`verify\` | after a front-end edit: type check, affected tests, screen check; exit 2 makes Claude fix it |
| MCP \`playwright\` | walk the screens, check keyboard flows, draft end-to-end tests (\`${PLAYWRIGHT_MCP}\`) |
| MCP \`chrome-devtools\` | Chrome DevTools for agents: the accessibility tree, Lighthouse audits and performance traces (\`${DEVTOOLS_MCP}\`) |

Install: \`claude plugin marketplace add ./plugins\` then \`claude plugin install ${PLUGIN_NAME}@stream-local\`.
Needs Node 22+ in the project that uses it (Vitest).
`,
  )

  const marketplace = {
    name: 'stream-local',
    owner: { name: 'Vanessa Aristizabal' },
    metadata: { description: 'Local marketplace for the Stream front-end kit.' },
    plugins: [{ name: PLUGIN_NAME, source: `./${PLUGIN_NAME}`, description: manifest.description }],
  }
  mkdirSync(join(dirname(out), '.claude-plugin'), { recursive: true })
  writeFileSync(join(dirname(out), '.claude-plugin/marketplace.json'), JSON.stringify(marketplace, null, 2) + '\n')
  return out
}

if (isMain()) {
  const out = buildPlugin(process.argv[2] ? resolve(process.argv[2]) : undefined)
  console.log(`plugin written to ${out}`)
}
