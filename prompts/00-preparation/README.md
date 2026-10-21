# 00 Preparación (15 minutos antes)

## Comandos
```bash
# Terminal 1: backend (Laravel). Hace falta para login y las pantallas reales.
cd /Users/vanessa.aristizabal/Dev/stream/backend
php artisan migrate --seed          # solo la primera vez
php artisan db:seed --class=DemoAccountsSeeder   # si ya tenía datos: agrega cuentas con presupuesto propio y campañas en todos los estados (es idempotente)
php artisan serve                   # http://localhost:8000
# opcional, para que las aprobaciones se apliquen: php artisan queue:work   (otra terminal)

# Terminal 2: frontend (Vue). Node 26.
cd /Users/vanessa.aristizabal/Dev/stream/frontend
nvm use                             # lee .nvmrc (26)
npm run dev                         # http://localhost:5173  (incluye el mock de /api/playbooks para el lanzamiento, el cambio masivo y el copy)

# Terminal 3: Storybook (design system y estados)
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use && npm run storybook   # http://localhost:6006

# Terminal 4: Claude Code, SIEMPRE desde la raiz
cd /Users/vanessa.aristizabal/Dev/stream && claude
# La primera vez aprueba los servidores MCP del proyecto (Playwright y Chrome DevTools): /mcp para ver que estan conectados.
```
Usuarios (clave `password`): `strategist@example.com`, `approver@example.com`, `admin@example.com`.

## Mapa de la app (para no perderse en la demo)
- **Accounts** (`/accounts`): todas las cuentas con su presupuesto mensual propio. Una cuenta (`/accounts/1`) tiene pestañas Campaigns, **Launch** (despliega las campañas del playbook en ESA cuenta) y Changelog.
- **Campaigns** (`/campaigns`): una pestaña por proveedor, filtro de estado (Active, Paused, Limited, Ended), filas Live y Simulated, y pestaña **Approvals** (aprobar o rechazar desde la tabla). Botones: Bulk budget change y Ad copy.
- **Changelog** (`/changelog`).

## Verificación rápida (todo debe estar en verde)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use
npm run check            # tipos, lint (con reglas de accesibilidad), pruebas, licencias, trazabilidad
npm run e2e              # Playwright + axe, claro y oscuro, 320 px
npm run build && npm run budget
npm run review:fixtures  # el primer filtro atrapa las 5 pantallas débiles
npm run audit:devtools   # accesibilidad (árbol de DevTools + Lighthouse), LCP y CLS de cada página; requiere frontend y backend corriendo
cd ../backend && ./vendor/bin/pest && ./vendor/bin/pint --test && ./vendor/bin/phpstan analyse --memory-limit=1G
```

## Ensayo
`./prompts/reset-demo.sh` deja el repo como antes de la demo. Páginas para tener abiertas: `/login`, `/accounts`, `/accounts/1?tab=launch`, `/campaigns`, Storybook.

## Si algo falla
- `ERR_CONNECTION_REFUSED`: el servidor de esa terminal no está corriendo (5173 frontend, 6006 Storybook, 8000 backend).
- Pruebas que no arrancan con "Cannot read properties of undefined (reading 'bind')": está en Node 20. `nvm use` en `frontend/`.
- Login falla: backend apagado o sin `migrate --seed`.
- La pestaña Launch, Bulk budget change y Ad copy solo existen con `npm run dev` (usan el mock); en un build de producción no aparecen.
- No use `pkill vite`: cierra también Storybook.
- No resetee la base con comandos destructivos: un hook los bloquea; use `DemoAccountsSeeder`.
