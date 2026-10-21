#!/usr/bin/env bash
# Deja el repo listo para repetir la demo: borra SOLO lo que generan los ejemplos de mockup y reinicia el mock de playbooks.
# Uso (desde la raiz del repo):  ./prompts/reset-demo.sh
set -euo pipefail
cd "$(dirname "$0")/.."

remove_component() { # <carpeta bajo frontend/src> <nombre>
  rm -fv "frontend/src/$1/$2.vue" "frontend/src/$1/$2.spec.ts" "frontend/src/$1/$2.stories.ts"
}
remove_component features/accounts/components AccountSummary
remove_component features/accounts/components ChangelogTimeline
remove_component features/campaigns/components ComplianceRules
rm -fv docs/specs/account-summary.md docs/specs/changelog-timeline.md docs/specs/compliance-rules.md
rm -fv frontend/e2e/launch-mcp.spec.ts

# Reinicia el estado en memoria del mock (lotes, recibos, limite de tasa) si el servidor de desarrollo esta arriba.
curl -s -o /dev/null -w "playbooks mock reset: HTTP %{http_code}\n" -X POST http://localhost:5173/api/playbooks/reset || echo "playbooks mock: el servidor de desarrollo no esta corriendo (no importa)"

echo
git status --short
echo "Si ve archivos que no reconoce, revise antes de seguir."
