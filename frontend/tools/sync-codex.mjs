#!/usr/bin/env node
// Keeps the Codex CLI mirror in step with .claude/, which is the single source of truth:
//   AGENTS.md            <- CLAUDE.md
//   .codex/agents/*.toml <- .claude/agents/*.md
//   .agents/skills/**    <- .claude/skills/**
//   .codex/hooks/**      <- .claude/hooks/**   (and .codex/hooks.json, with this checkout's absolute paths)
// Run: npm run sync:codex   (a test fails when the mirror is stale)
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const REPO = resolve(here, '../..')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

/** Pure: an agent as a Codex TOML file. The body is a TOML literal string, so it needs no escaping. */
export function agentToToml(markdown) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(markdown)
  if (!match) throw new Error('an agent needs front matter')
  const field = (name) => new RegExp(`^${name}: (.+)$`, 'm').exec(match[1])?.[1].trim()
  const body = match[2].trim()
  if (body.includes("'''")) throw new Error("an agent body cannot contain '''")
  return `name = ${JSON.stringify(field('name'))}\ndescription = ${JSON.stringify(field('description'))}\ndeveloper_instructions = '''\n${body}\n'''\n`
}

/** Everything the mirror should contain: relative path -> text. `hooks.json` is returned separately (absolute paths). */
export function computeMirror(repo = REPO) {
  const out = new Map()
  const read = (p) => readFileSync(join(repo, p), 'utf8')

  out.set(
    'AGENTS.md',
    `<!-- Generated from CLAUDE.md by frontend/tools/sync-codex.mjs. Edit CLAUDE.md, then run \`npm run sync:codex\`. -->\n${read('CLAUDE.md')}`,
  )

  for (const file of readdirSync(join(repo, '.claude/agents')).filter((f) => f.endsWith('.md'))) {
    out.set(`.codex/agents/${file.replace(/\.md$/, '.toml')}`, agentToToml(read(`.claude/agents/${file}`)))
  }
  for (const path of walk(join(repo, '.claude/skills')))
    out.set(`.agents/skills/${relative(join(repo, '.claude/skills'), path)}`, readFileSync(path, 'utf8'))
  for (const path of walk(join(repo, '.claude/hooks')))
    out.set(`.codex/hooks/${relative(join(repo, '.claude/hooks'), path)}`, readFileSync(path, 'utf8'))
  return out
}

/** The Codex hooks file: the same hooks as .claude/settings.json, pointing at the mirrored scripts of this checkout. */
export function hooksJson(repo = REPO) {
  const settings = JSON.parse(readFileSync(join(repo, '.claude/settings.json'), 'utf8'))
  const swap = (command) =>
    command.replace('node "$CLAUDE_PROJECT_DIR/.claude/hooks/', `node '${repo}/.codex/hooks/`).replace(/\.mjs"$/, ".mjs'")
  const hooks = Object.fromEntries(
    Object.entries(settings.hooks).map(([event, groups]) => [
      event,
      groups.map((g) => ({ ...g, hooks: g.hooks.map((h) => ({ ...h, command: swap(h.command) })) })),
    ]),
  )
  return JSON.stringify({ hooks }, null, 2) + '\n'
}

function main() {
  const mirror = computeMirror()
  // Remove what no longer has a source (an agent or skill that was deleted), then write.
  for (const dir of ['.codex/agents', '.agents/skills', '.codex/hooks']) rmSync(join(REPO, dir), { recursive: true, force: true })
  for (const [path, text] of mirror) {
    const target = join(REPO, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  }
  writeFileSync(join(REPO, '.codex/hooks.json'), hooksJson())
  console.log(`sync-codex: ${mirror.size} files written`)
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main()
