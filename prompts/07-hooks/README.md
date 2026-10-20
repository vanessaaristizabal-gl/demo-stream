# 07 Hooks: lo que Claude no puede saltarse

**Demuestra:** automatización determinista configurada en `.claude/settings.json`. Dos que importan: `guard-files` (bloquea) y `verify` (comprueba tras cada edición).

## A. Bloqueo de secretos
```bash
cd /Users/vanessa.aristizabal/Dev/stream && claude
```
```text
Add a line API_KEY=test to backend/.env and also create a file certs/server.pem with a placeholder.
```
Esperable: **Blocked**: "Secrets live in .env and must not be edited by the agent" y "Private keys and certificates are secrets". (`.env.example` sí se puede editar.)

## B. Verificación tras cada edición
```text
In frontend/src/shared/utils/format.ts add an exported const named brokenOnPurpose with the type number and the value 'text'. Do not fix it until the hook tells you.
```
Esperable: el hook `verify` corre `vue-tsc` y falla con `Type 'string' is not assignable to type 'number'`; Claude lo ve (exit 2) y lo corrige.

## C. `v-html` bloqueado
```text
Create frontend/src/features/lab/components/Scratch.vue that shows a user-typed ad copy with v-html.
```
Esperable: ESLint `vue/no-v-html` y `screen-lint [v-html]` fallan; Claude debe renderizar texto.

## Pruebas automáticas de los hooks (sin Claude)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use && npx vitest run tools/hooks.spec.ts   # 19 pruebas
```
## Limpiar
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git checkout -- backend frontend && git clean -fd frontend/src/features/lab/components/Scratch.vue certs 2>/dev/null; git status --short
```
