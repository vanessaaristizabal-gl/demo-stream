# 11 Flujo de AdVise en la app: lanzar el playbook en UNA cuenta, y aprobar en Campaigns

**Demuestra** (con los componentes del design system, sin cambiar el diseño de la UI) lo que se ve en las capturas de AdVise y en los criterios del MVP:
- **Cada cuenta tiene su página** (`/accounts/1`) y **su propio presupuesto mensual** (viene de Salesforce; no hay "grupos" de cuentas). La tabla de campañas dice a qué cuenta pertenece cada una y enlaza a su página.
- **Lanzar por cuenta** (pestaña **Launch**): se despliegan las campañas del playbook en esa cuenta. Los valores de la cuenta son los predeterminados y solo se cambian "para este lanzamiento" si hace falta.
- **Compliance en todas partes:** el rulebook OEM (Stellantis, 35 reglas) se aplica al lanzar; una cuenta que no es Stellantis queda retenida con la razón; una campaña que rompe una regla (STL-022) queda retenida sola.
- **Presupuesto propio de la cuenta:** sin presupuesto en Salesforce todo queda retenido; un tope por encima del presupuesto de la cuenta también.
- **Toda escritura aprobada y atribuible:** vista previa que no escribe, una aprobación, recibos del changelog (quién, qué, ruta validated, compliance, dry-run, write, fecha).
- **Fallo parcial:** 2 campañas fallan (límite de tasa del proveedor y rechazo) y se reintentan solo esas, con `Idempotency-Key`.
- **Aprobaciones dentro de Campaigns:** pestaña **Approvals** con una tabla; cada fila tiene iconos para aprobar o rechazar; el conteo de pendientes está siempre en la etiqueta de la pestaña.
- **Estado de las campañas:** filtro Active, Paused, Limited, Ended.

## Guion (6 minutos)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use && npm run dev
cd /Users/vanessa.aristizabal/Dev/stream/backend && php artisan serve     # y, si ya tenía datos: php artisan db:seed --class=DemoAccountsSeeder
```
1. `http://localhost:5173/login` como `strategist@example.com` / `password`. Menú **Accounts**: 6 cuentas, cada una con su presupuesto (Lakeside Toyota: "No budget").
2. Abra **Schrute CDJR** (Stellantis, $5,550.00 al mes). Pestaña **Launch**.
3. Paso 1 Playbook: Stellantis ya viene elegido (es el de la cuenta); 5 campañas, todas marcadas. Continuar.
4. Paso 2 Settings: todo viene de la cuenta ("this account's monthly budget"); no hay campos. Pulse **Change for this launch**, ponga `50` (error: mínimo $100.00, el botón se deshabilita) y **Use the account defaults**. **Build the preview**.
5. Paso 3: banner "Preview only". Pestañas **Changes to apply 4** y **Held 1** (Brand · Search, retenida por STL-022). Pulse **Approve 4 changes**: resultado "2 applied, 2 failed", una por límite de tasa y otra rechazada por el proveedor. **Retry failed**: solo esas dos. Aparecen los **recibos**.
6. Vuelva atrás y pruebe **Lakeside Toyota** → Launch: aviso "no budget in Salesforce"; todas las campañas retenidas.
7. **Campaigns**: filtro de estado (Limited, Ended), clic en el nombre de una cuenta (va a su página), pestaña **Approvals**: iconos de aprobar y rechazar por fila (entre como `approver@example.com` para decidir).
8. Teclado: Tab, Espacio y Enter bastan; el foco salta al título de cada paso.

## Comprobar sin navegador
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend
npx vitest run mock-backend src/features/accounts src/features/campaigns src/shared
npm run e2e -- e2e/accounts.spec.ts e2e/approvals.spec.ts e2e/campaigns.spec.ts e2e/bulk-copy.spec.ts
```
Código: `src/features/accounts/launch/` (LaunchWizard, LaunchPanel), `src/features/accounts/views/AccountView.vue`, `src/features/campaigns/approvals/`, `src/shared/components/BatchPreview.vue`, mock en `mock-backend/handler.ts`, spec en `docs/specs/account-launch.md`.

## Otros procesos de las capturas que se podrían integrar después
Migración de Fluency conservando los IDs de campaña originales (criterio 2 del MVP), edición de copy creativo con ChangeSet validado (ya cubierto por el campo de plantilla de 30 caracteres, en Campaigns > Ad copy), y administración de playbooks y reglas OEM por los admins (criterio 7).
