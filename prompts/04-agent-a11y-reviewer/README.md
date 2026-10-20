# 04 Agente `a11y-reviewer` (WCAG 2.2 AA)

**Demuestra:** revisión de accesibilidad que va más allá de axe: ciclo de foco, nombres, teclado, contraste en los dos temas.

## Prompt
```bash
cd /Users/vanessa.aristizabal/Dev/stream && claude
```
```text
Use the a11y-reviewer agent to review frontend/src/features/lab/components/DenseList.vue, InlineBudgetEdit.vue and DeployWizard.vue (and their stories). Trace the focus lifecycle: what happens to focus when the control that has it is replaced, disabled or unmounted (editing a budget, changing a page, changing a wizard step)? Run the a11y e2e spec and report the exact result.
```
## Qué debería pasar
Corre `npm run e2e -- e2e/a11y.spec.ts` y `e2e/lab.spec.ts`, rastrea el foco (paginación, editor en línea, pasos del asistente), cita criterios WCAG con `file:line`, y dice qué debe revisar una persona (pasada por teclado, zoom 200%, VoiceOver).

## Mostrar en vivo (opcional)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use
npm run e2e -- e2e/lab.spec.ts -g "accessibility"     # axe en claro y oscuro, 4 pantallas del lab
npm run lint                                          # ahora incluye eslint-plugin-vuejs-accessibility
```
Pasada manual: abra `/lab/rows`, use solo Tab, Enter, Espacio y Escape; el foco nunca debe perderse.
