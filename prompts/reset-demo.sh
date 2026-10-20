#!/usr/bin/env bash
# Deja el repo listo para repetir la demo: borra SOLO lo que generan los ejemplos de mockup y reinicia el mock del lab.
# Uso (desde la raiz del repo):  ./prompts/reset-demo.sh
set -euo pipefail
cd "$(dirname "$0")/.."

for name in AccountSummary ChangelogTimeline ComplianceRules; do
  rm -fv "frontend/src/features/lab/components/${name}.vue" "frontend/src/features/lab/components/${name}.spec.ts" "frontend/src/features/lab/components/${name}.stories.ts"
done
rm -fv docs/specs/account-summary.md docs/specs/changelog-timeline.md docs/specs/compliance-rules.md

# Reinicia el estado en memoria del mock (lote, lista, receipts, rate limit) si el servidor de desarrollo esta arriba.
curl -s -o /dev/null -w "lab mock reset: HTTP %{http_code}\n" -X POST http://localhost:5173/api/lab/reset || echo "lab mock: el servidor de desarrollo no esta corriendo (no importa)"

echo
git status --short
echo "Si ve archivos que no reconoce, revise antes de seguir."
