# 05 Agente `code-reviewer`: revisión independiente de un cambio

**Demuestra:** "hacer un cambio pequeño con ayuda del agente, revisar el diff y correr los checks" (entregable del ticket).

## Preparación
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git status --short   # limpio
claude
```
## Prompt 1: un cambio pequeño
```text
In frontend/src/features/lab/components/DenseList.vue, show the number of the current page and the total number of pages next to the campaign count ("Page 3 of 40"), reusing existing formatters. Update the matching spec and the dense-list spec (add AC-18). Run the checks.
```
## Prompt 2: revisión independiente (no la hace quien escribió el código)
```text
Use the code-reviewer agent to review the change I just made (git diff). Return ranked findings.
```
## Comprobar
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git diff --stat
cd frontend && npm run check
```
## Limpiar
```bash
cd /Users/vanessa.aristizabal/Dev/stream && git checkout -- frontend docs && git status --short
```
