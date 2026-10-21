# Prompts para la demo

Cada carpeta es un ejemplo independiente: qué demuestra, qué comandos correr antes, el prompt exacto para pegar en Claude Code, qué debería pasar y cómo limpiar para repetirlo.

| Carpeta | Demuestra | Pieza |
|---|---|---|
| `00-preparation` | Dejar todo listo antes de empezar | comandos |
| `01-skill-screen-from-spec` | Del spec escrito + mockup a componente, pruebas por criterio e historias | skill `screen-from-spec` |
| `02-skill-mockup-to-screen` | Del mockup solamente: Claude redacta el spec, usted lo aprueba, luego genera | skill + revisión humana |
| `03-agent-screen-reviewer` | Revisor de solo lectura que atrapa las 5 pantallas débiles | agente `screen-reviewer` |
| `04-agent-a11y-reviewer` | Revisión WCAG 2.2 AA | agente `a11y-reviewer` |
| `05-agent-code-reviewer` | Revisión independiente por stack: TypeScript y Vue de un lado, PHP y Laravel del otro | agentes `frontend-code-reviewer` y `backend-code-reviewer` |
| `06-agent-write-path-guardian` | Protección de la regla "un solo write path" | agente `write-path-guardian` |
| `07-hooks` | Bloqueo de secretos y verificación tras cada edición | hooks |
| `08-mcp-playwright` | Recorrer pantallas, redactar e2e, árbol de accesibilidad, Lighthouse y trazas | MCP de Playwright y de Chrome DevTools |
| `09-plugin` | Todo empaquetado, instalado en una configuración limpia | plugin |
| `10-mockup-compliance-rules` | Tercer mockup: reglas OEM con fechas efectivas y campañas que las rompen | skill |
| `11-flow-account-launch` | Flujo de AdVise por cuenta: Launch, compliance OEM, presupuesto propio, fallo parcial, recibos; y aprobaciones en Campaigns | app |
| `12-skill-ticket-to-spec` | De un ticket de GitHub a spec, y de spec a API, pantalla o ambos | skill `ticket-to-spec` |

Orden sugerido para 30 minutos: 00, 11 (la app), 01 (skill), 03 (reviewer), 07 (hooks), 04 o 05 (otro agente), 09 (plugin). Los demás quedan de reserva.

## Reglas de oro
- Lance Claude Code **desde la raíz del repo**: `cd /Users/vanessa.aristizabal/Dev/stream && claude`.
- Node 26 en `frontend/` (`nvm use`). Con Node 20 las pruebas de Vitest no corren.
- Los ejemplos de mockup **no tienen su componente construido**: se generan en vivo. Para repetir la demo corra `./prompts/reset-demo.sh`.
- Los criterios de los specs de ejemplo son ilustrativos (no vienen de tickets); en el proyecto real los escribe usted con el product owner.
- Construct aún no está disponible: no hay ejemplo con Construct.
