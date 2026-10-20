# 00 Preparación (15 minutos antes)

## Comandos
```bash
# Terminal 1: backend (Laravel). Hace falta para login y las pantallas reales.
cd /Users/vanessa.aristizabal/Dev/stream/backend
php artisan migrate --seed          # solo la primera vez
php artisan serve                   # http://localhost:8000
# opcional, para que las aprobaciones se apliquen: php artisan queue:work   (otra terminal)

# Terminal 2: frontend (Vue). Node 26.
cd /Users/vanessa.aristizabal/Dev/stream/frontend
nvm use                             # lee .nvmrc (26)
npm run dev                         # http://localhost:5173  (incluye el mock del lab en /api/lab)

# Terminal 3: Storybook (design system y estados)
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use && npm run storybook   # http://localhost:6006

# Terminal 4: Claude Code, SIEMPRE desde la raiz
cd /Users/vanessa.aristizabal/Dev/stream && claude
```
Usuarios (clave `password`): `strategist@example.com`, `approver@example.com`, `admin@example.com`.

## Verificación rápida (todo debe estar en verde)
```bash
cd /Users/vanessa.aristizabal/Dev/stream/frontend && nvm use
npm run check            # tipos, lint (con reglas de accesibilidad), pruebas, licencias, trazabilidad
npm run e2e              # Playwright + axe, claro y oscuro, 320 px, presupuesto de rendimiento
npm run build && npm run budget
npm run review:fixtures  # el primer filtro atrapa las 5 pantallas débiles
```

## Ensayo
`./prompts/reset-demo.sh` deja el repo como antes de la demo. Páginas para tener abiertas: `/login`, `/lab`, `/lab/deploy`, `/lab/bulk`, Storybook.

## Si algo falla
- `ERR_CONNECTION_REFUSED`: el servidor de esa terminal no está corriendo (5173 frontend, 6006 Storybook, 8000 backend).
- Pruebas que no arrancan con "Cannot read properties of undefined (reading 'bind')": está en Node 20. `nvm use` en `frontend/`.
- Login falla: backend apagado o sin `migrate --seed`.
- No use `pkill vite`: cierra también Storybook.
