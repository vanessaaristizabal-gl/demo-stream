# 02 Del mockup solamente: Claude redacta el spec, usted lo aprueba

**Demuestra:** el flujo con un product owner. Claude propone criterios a partir de una imagen; la persona los corrige (los criterios son suyos), y solo entonces se genera el componente.
**Archivo:** `mockup.png` (línea de tiempo del changelog de AdVise: quién escribió, qué, por qué ruta, cuándo; filtros y contadores).

## Preparación
```bash
cd /Users/vanessa.aristizabal/Dev/stream && claude
```

## Prompt 1: redactar el spec (sin código todavía)
```text
Read prompts/02-skill-mockup-to-screen/mockup.png. Draft a screen spec for it following docs/specs/README.md, saved as docs/specs/changelog-timeline.md with "Component: features/accounts/components/ChangelogTimeline". List the states, testable acceptance criteria (AC-n), edge cases and what is out of scope. Do not write any code yet. Mark every criterion you are unsure about with a question for me.
```
**Aquí usted edita el spec en vivo** (agregue, quite o corrija 1 o 2 criterios): es el punto de la demo.

## Prompt 2: generar
```text
/screen-from-spec docs/specs/changelog-timeline.md
Use the shared DateText and the design-system tokens. Entries come from the changelog receipts of the governed write path (actor, summary, path steps, time). Run the checks and ask the screen-reviewer agent for a review.
```

## Qué debería pasar
Crea `ChangelogTimeline.vue/.spec.ts/.stories.ts`; los filtros (All, Rules, AdVisements, Manual) son un grupo accesible con teclado; cada entrada muestra actor, resumen, ruta y hora con `<DateText>`; estados loading, empty, error.

## Opcional: cablearlo
Pida "use ChangelogTimeline in the Changelog tab of the account page instead of the table (AccountChangelog), keeping its states". La pestaña carga el changelog de la cuenta (`/api/changelog?account_id=`), así que verá datos reales del backend sembrado.

## Comprobar
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && npm run traceability && npx vitest run src/features/accounts/components/ChangelogTimeline
```
## Limpiar: `./prompts/reset-demo.sh`
