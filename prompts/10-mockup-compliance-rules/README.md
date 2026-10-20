# 10 Mockup de cumplimiento OEM (tercer ejemplo, de reserva)

**Demuestra:** lo mismo que 01/02 sobre otra superficie que usted mantiene en el puesto: reglas de un fabricante con fecha efectiva y las campañas que las rompen, con el porqué y el arreglo.
**Archivo:** `mockup.png`.

## Prompt
```text
Read prompts/10-mockup-compliance-rules/mockup.png and draft docs/specs/compliance-rules.md (Component: features/lab/components/ComplianceRules) following docs/specs/README.md. Show me the criteria first. Pay attention to: effective dates shown through the shared formatter, a rule not yet effective is not reported as breaking, every violation says why and what the fix is, and server text is never rendered as HTML. After I approve, run /screen-from-spec on it and then the screen-reviewer agent.
```
## Comprobar
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && npm run traceability && npx vitest run src/features/lab/components/ComplianceRules
```
## Limpiar: `./prompts/reset-demo.sh`
