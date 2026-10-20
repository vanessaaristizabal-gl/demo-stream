# 01 Skill `screen-from-spec`: de spec + mockup a pantalla

**Demuestra:** un spec escrito por una persona (criterios + estados) se convierte en componente, una prueba por criterio (`AC-n`), una historia por estado, y luego lo revisa el agente `screen-reviewer`.
**Archivos:** `spec.md` (el spec), `mockup.png` (la referencia visual: encabezado de cuenta de AdVise con 3 estados de ritmo).

## Preparación
```bash
cd /Users/vanessa.aristizabal/Dev/stream
cp prompts/01-skill-screen-from-spec/spec.md docs/specs/account-summary.md
cd frontend && nvm use && npm run traceability    # fallará: el componente aún no existe (es lo esperado)
cd .. && claude
```

## Prompt (pegar en Claude Code)
```text
/screen-from-spec docs/specs/account-summary.md

The visual reference is prompts/01-skill-screen-from-spec/mockup.png: read it. Build the component only with design-system tokens and Ds* components; the three pace states in the mockup are the three Storybook stories. Before you generate anything, explain in a few lines which props and events the criteria imply and what would break without the focus and progressbar guards. When you finish, run the checks and ask the screen-reviewer agent to review it against the spec.
```

## Qué debería pasar
1. Claude lee el spec y la imagen, explica props/eventos (modo tutor).
2. Crea `AccountSummary.vue`, `.spec.ts` (una prueba por `AC-n`) y `.stories.ts` (Loading, Error, OnPace, Underpacing, Overspending) en `frontend/src/features/lab/components/`.
3. Cada edición dispara los hooks: formato, lint, `vue-tsc`, pruebas afectadas y `screen-lint` (verá mensajes de verificación si algo falla; Claude lo corrige).
4. Corre `npm run check` y llama al agente `screen-reviewer`; muestre su veredicto y hallazgos.

## Comandos para mostrar el resultado
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend
npm run traceability                       # ahora en verde: 10 criterios y 5 estados cubiertos
npx vitest run src/features/lab/components/AccountSummary
npm run storybook                          # Features/Lab/AccountSummary, alternar tema claro/oscuro
```
**Pregunta de entrevista:** quite el guard de `progressbar` y muestre que la prueba AC-5 falla (la prueba muerde).

## Limpiar para repetir
`./prompts/reset-demo.sh`
