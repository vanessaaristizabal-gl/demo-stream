# 04 Agente `a11y-reviewer` (WCAG 2.2 AA)

**Demuestra:** revisión de accesibilidad que va más allá de axe: ciclo de foco, nombres, teclado, contraste en los dos temas, **árbol de accesibilidad de Chrome DevTools** y Lighthouse.

## Prompt
```bash
cd /Users/vanessa.aristizabal/Dev/stream && claude
```
```text
Use the a11y-reviewer agent to review frontend/src/features/campaigns/approvals/components/ApprovalsTable.vue, frontend/src/features/campaigns/components/CampaignTable.vue and frontend/src/features/accounts/launch/LaunchWizard.vue (and their stories). Trace the focus lifecycle: what happens to focus when the control that has it is replaced, disabled or unmounted (approving a row, changing a status filter, changing a wizard step, switching a tab)? Run the a11y e2e spec, and with the dev server and the backend running also run npm run audit:devtools. Report the exact results.
```
## Qué debería pasar
Corre `npm run e2e -- e2e/a11y.spec.ts` y `npm run audit:devtools`, rastrea el foco (filtros, botones de fila, pasos del asistente, pestañas), cita criterios WCAG con `file:line`, y dice qué debe revisar una persona (pasada por teclado, zoom 200%, VoiceOver).

## Mostrar en vivo (opcional)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use
npm run e2e -- e2e/a11y.spec.ts          # axe en claro y oscuro, todas las páginas, y 320 px
npm run audit:devtools                    # árbol de accesibilidad + Lighthouse desktop y mobile + LCP y CLS (frontend y backend corriendo)
npm run lint                              # incluye eslint-plugin-vuejs-accessibility
```
**Con el MCP de Chrome DevTools** (ya conectado desde `.mcp.json`), en Claude Code:
```text
Using the chrome-devtools MCP, open http://localhost:5173/login, sign in as strategist@example.com / password, open /campaigns?tab=approvals, take an accessibility snapshot and run a Lighthouse audit (mobile). Report the score, any failing audit, and any control without an accessible name.
```
Pasada manual: abra `/campaigns?tab=approvals`, use solo Tab, Enter, Espacio y las flechas entre pestañas; el foco nunca debe perderse.
