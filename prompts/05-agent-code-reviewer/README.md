# 05 Agentes `frontend-code-reviewer` y `backend-code-reviewer`

**Demuestra:** revisión independiente por stack, cada uno con sus reglas y skills: el de frontend aplica la guía de estilo de TypeScript de Google, la guía de estilo de Vue, Composition API, Pinia, rendimiento (web.dev) y el lenguaje de diseño; el de backend aplica PSR-12 y Laravel, OWASP y la guía de diseño de APIs de Google. También es el entregable "hacer un cambio pequeño con ayuda del agente, revisar el diff y correr los checks".

## Preparación
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git status --short   # limpio
claude
```
## A. Frontend: cambio pequeño + revisión
```text
In frontend/src/features/campaigns/components/CampaignTable.vue add a "Clear filters" button that appears only when a status filter or a search text is active and resets both. Update the spec with a test, and the stories. Run the checks.
```
```text
Use the frontend-code-reviewer agent to review the change I just made (git diff). Return ranked findings.
```
## B. Backend: cambio pequeño + revisión
```text
Add an optional ?status= filter to GET /api/campaigns (active, paused, limited or ended; anything else is a 422). Add Pest tests, update the OpenAPI document and frontend/src/shared/api/types.ts if needed. Run the checks.
```
```text
Use the backend-code-reviewer agent to review the change I just made (git diff). Return ranked findings.
```
## Qué debería pasar
Cada agente lee sus reglas y skills (los nombra), corre sus comprobaciones (`npm run check` / `pest`, `pint`, `phpstan`), y entrega un veredicto con hallazgos ordenados por gravedad con `file:line`. Muestre que **no** mezclan stacks: el de frontend recomienda `backend-code-reviewer` si el cambio toca la API y viceversa.

## Comprobar
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git diff --stat
cd frontend && npm run check
cd ../backend && ./vendor/bin/pest && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --memory-limit=1G
```
## Limpiar
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git checkout -- backend frontend docs && git status --short
```
