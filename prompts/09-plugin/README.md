# 09 Plugin: todo empaquetado, instalado en una configuración limpia

**Demuestra:** skill + revisor + hooks + MCP en una unidad instalable, y que funciona fuera de este repo. El plugin se **genera** desde `.claude/` (una sola fuente de verdad).

## Comandos
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use
npm run plugin:build                                            # regenera plugins/stream-frontend-kit
cd .. && claude plugin validate plugins --strict                # validación estricta del manifiesto
# instalar en una configuración VACIA (no toca su ~/.claude):
export CLAUDE_CONFIG_DIR=$(mktemp -d)
claude plugin marketplace add ./plugins
claude plugin install stream-frontend-kit@stream-local
claude plugin details stream-frontend-kit@stream-local          # 2 skills, 1 agente, 2 hooks, 1 MCP
unset CLAUDE_CONFIG_DIR
```
## Pruebas automáticas
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && npx vitest run tools/plugin.spec.ts
```
Prueban: manifiesto, piezas presentes, el MCP fijado (no `latest`), las convenciones dentro de un skill (los plugins no cargan `CLAUDE.md`), los hooks ejecutados desde la carpeta del plugin sin el repo, y que la carpeta versionada coincide con una compilación nueva.

**Frase clave:** "los plugins no cargan CLAUDE.md, por eso el lenguaje de diseño viaja como skill".
