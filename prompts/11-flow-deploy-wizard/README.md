# 11 Flujo de AdVise en la app: Deploy a playbook

**Demuestra** (sin tocar el diseño de la UI, solo componentes del design system) lo que se ve en las capturas de AdVise (Playbooks Library, Deploy wizard, Changelog con recibos) sobre las APIs mock del lab:
- **Compliance en todas partes:** el rulebook OEM (Stellantis, 35 reglas) se aplica al desplegar; una cuenta Toyota queda retenida con la razón.
- **Presupuesto de Salesforce:** una cuenta sin presupuesto activo queda retenida ("the campaign holds at deploy until one exists"); un tope por encima del sobre aprobado también.
- **Toda escritura aprobada y atribuible:** vista previa que no escribe, una aprobación, recibos del changelog (quién, qué, ruta validated, compliance, dry-run, write, fecha).
- **Fallo parcial:** 2 cuentas fallan (límite de tasa del proveedor y rechazo), se reintentan solo esas, con Idempotency-Key.

## Guion (5 minutos)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use && npm run dev
cd /Users/vanessa.aristizabal/Dev/stream/backend && php artisan serve
```
1. `http://localhost:5173/login` como `strategist@example.com` / `password`; menú **Lab**, **Deploy a playbook**.
2. Paso 1: deje **Stellantis**; marque "Select all accounts" (10). Señale las etiquetas "None: will hold" y la cuenta Toyota.
3. Paso 2: tope `50` (error: mínimo $100.00, el botón se deshabilita); luego `1650`. Estado "Paused at write (recommended)".
4. Paso 3 "Build the preview": banner "Preview only"; tablas de retenidos (3 razones distintas) y de cambios.
5. **Approve**: resultado "N applied, 2 failed", una por límite de tasa. **Retry failed**: solo esas dos.
6. Aparecen los **Changelog receipts**.
7. Muestre que el teclado basta: Tab, Espacio, Enter; el foco salta al título de cada paso.

## Comprobar sin navegador
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend
npx vitest run lab-api src/features/lab/components/DeployWizard
npm run e2e -- e2e/lab.spec.ts -g "playbook deploy"
```
Código: `src/features/lab/components/DeployWizard.vue`, `views/DeployWizardView.vue`, mock en `lab-api/handler.ts`, spec en `docs/specs/playbook-deploy-wizard.md`.

## Otros procesos de las capturas que se podrían integrar después
Migración de Fluency conservando los IDs de campaña originales (criterio 2 del MVP), edición de copy creativo con ChangeSet validado (ya cubierto por el campo de plantilla de 30 caracteres), y administración de playbooks/OEM por los admins (criterio 7).
