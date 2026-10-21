# 12 Skill `ticket-to-spec`: de un ticket de GitHub a spec y a código

**Demuestra:** spec-driven development a partir de un ticket real. La skill lee el issue, escribe el spec (pantalla, API o ambos), **se detiene para que usted lo apruebe** y solo entonces construye. No inventa criterios: si el ticket no los trae, pregunta.

**Tickets de ejemplo** (en https://github.com/vanessaaristizabal-gl/demo-stream/issues):
| Issue | Alcance | Qué produce |
|---|---|---|
| #1 Campaign Explorer | UI y API | `docs/specs/<slug>.md` y `docs/specs/api/<slug>.md`; endpoint de campañas con paginación, orden y filtros en el servidor; pantalla con edición de presupuesto en la fila |
| #2 Bulk budget change API | Solo API | `docs/specs/api/<slug>.md`; preview con retenidos, aplicación con fallo parcial, reintento y límite de tasa, todo por `GovernedWritePath` |

## Preparación
```bash
cd /Users/vanessa.aristizabal/Dev/stream && gh auth status   # sesión de GitHub activa
claude
```
Si quiere usar el MCP de GitHub en lugar de `gh`, autorícelo con `/mcp` en una sesión interactiva; sin él la skill usa `gh issue view`.

## Prompt A: ticket con API y pantalla (#1)
```text
/ticket-to-spec 1

Read the issue, write the specs it needs and show them to me. Do not write any code until I approve the specs.
```
Después de revisar los specs:
```text
Approved. Build the API first, then the screen, and finish with the reviewers and the traceability table.
```

## Prompt B: ticket solo de API (#2)
```text
/ticket-to-spec 2

Write the API spec and stop for my approval. Tell me which criteria could be ambiguous before I approve.
```

## Qué debería pasar
1. Lee el issue con `gh` y decide el alcance por las etiquetas `ui` y `api`.
2. Escribe los specs con un `AC-n` por criterio del ticket (misma numeración) y una sección de preguntas abiertas si algo no está claro.
3. **Se detiene.** Usted aprueba o corrige.
4. API primero (`add-laravel-endpoint`, pruebas Pest tituladas `AC-n`, `openapi.json`, tipos y mock), luego pantalla (`screen-from-spec`); revisan `write-path-guardian`, `backend-code-reviewer` y `screen-reviewer`.
5. Entrega una tabla criterio, archivo de prueba y resultado.

## Limpiar para repetir
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git status --short   # revise qué creó
git checkout -- backend frontend docs && git clean -fd docs/specs backend frontend/src
```
Revise `git status` antes de limpiar: ese comando borra todo lo no versionado en esas rutas.
