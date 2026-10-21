# 03 Agente `screen-reviewer` atrapa las 5 pantallas débiles

**Demuestra:** un revisor de solo lectura (no puede editar) que juzga una pantalla contra su spec y el lenguaje de diseño. Las 5 pantallas están hechas mal a propósito en `frontend/review-fixtures/weak-screens/` (fuera de `src/`, no se construyen).

## Paso 1: el primer filtro determinista (10 segundos)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use && npm run review:fixtures
# 5/5 planted weaknesses caught by the first pass
```
## Paso 2: el agente (juicio, lo que un script no puede)
```bash
cd /Users/vanessa.aristizabal/Dev/stream && claude
```
```text
Use the screen-reviewer agent to review frontend/review-fixtures/weak-screens/05-DropsFailedItems.vue against docs/specs/bulk-approval-preview.md. Do not read manifest.json.
```
Repita con las otras cuatro cuando quiera (01 colores/espaciado, 02 sin estado de error, 03 `v-html`, 04 carga 2.000 filas):
```text
Use the screen-reviewer agent to review each file in frontend/review-fixtures/weak-screens/ independently (specs: docs/specs/bulk-approval-preview.md for 01, 02 and 05; template-field.md for 03; for 04 there is no spec: judge it against .claude/rules/ux-information-design.md and the design language, where lists are paged by the server). One verdict per file. Do not read manifest.json.
```

## Qué debería pasar
Veredicto **FAIL** en cada archivo, nombrando el defecto sembrado: 01 colores hex y px; 02 `catch` vacío (falla silenciosa); 03 `v-html` con texto del usuario (XSS); 04 `per_page=2000` y filtro en el navegador; 05 muestra aplicados y descarta los fallidos y dice "Done". Además lista criterios del spec no cumplidos y qué no puede verificar (contraste, lector de pantalla).

## Contraste: una pantalla buena
```text
Use the screen-reviewer agent to review frontend/src/shared/components/BatchPreview.vue against docs/specs/bulk-approval-preview.md.
```
Esperable: hallazgos menores o PASS WITH FIXES, no un FAIL gratuito (el agente no inventa).

## Si quiere demostrar "ajustar el revisor"
Cambie una regla en `.claude/agents/screen-reviewer.md`, repita el prompt y anote el cambio en `docs/learning-plan/REVIEW_LOG.md`.
