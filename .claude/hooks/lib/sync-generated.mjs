// Keeps generated artifacts in step with their sources, so nobody has to remember a manual command.
//   frontend/tokens/tokens.json  -> npm run tokens           (CSS variables and typed map)
//   backend API code             -> php artisan scramble:export  (docs/openapi.json)
// Called by format.mjs after formatting. Returns an error string only when a source is invalid.
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

export function syncGenerated(file, root) {
  const rel = file.startsWith(root + '/') ? file.slice(root.length + 1) : file
  const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd: resolve(root, cwd), encoding: 'utf8' })

  if (rel === 'frontend/tokens/tokens.json' || rel === 'frontend/tokens/build.mjs') {
    const r = run('node', ['tokens/build.mjs'], 'frontend')
    // An invalid token (dangling reference, bad JSON) is the editor's mistake: report it now.
    return r.status === 0 ? null : `tokens could not be generated:\n${r.stderr || r.stdout}`
  }

  const isApiCode =
    rel.endsWith('.php') &&
    (/^backend\/app\/Http\//.test(rel) || /^backend\/app\/Domain\/[^/]+\/Models\//.test(rel) || rel === 'backend/routes/api.php')
  if (isApiCode) {
    // Best effort: a half-finished edit may not parse yet. The ApiDocsTest is the backstop, so never block here.
    run('php', ['artisan', 'scramble:export'], 'backend')
  }
  return null
}
