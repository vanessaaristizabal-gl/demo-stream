# 06 Agente `write-path-guardian`: la regla "un solo write path"

**Demuestra:** la regla del producto: todo cambio a una cuenta real pasa por `GovernedWritePath` (resolver contra estado vivo, compliance, aprobación, dry run, escritura idempotente, recibo). Solo Governance puede usar el lado de escritura de un proveedor, y `backend/tests/Arch` lo hace cumplir.

## Prompt A: auditoría de lo existente
```bash
cd /Users/vanessa.aristizabal/Dev/stream && claude
```
```text
Use the write-path-guardian agent to audit backend/app/Domain/Governance against the single-write-path invariants: single write path, idempotency, compliance, field locks, approvals, audit receipts and emergency stop. Report what is enforced structurally (tests/Arch) and what only by convention.
```
## Prompt B: intentar romper la regla (el agente debe protestar)
```text
I want to add a quick endpoint that calls CampaignWriter directly from a controller to pause a campaign faster. Check with the write-path-guardian agent whether that is allowed and explain what would fail.
```
## Comprobar
```bash
cd /Users/vanessa.aristizabal/Dev/stream/backend
./vendor/bin/pest tests/Arch        # las pruebas de arquitectura que impiden un segundo write path
./vendor/bin/pest                   # suite completa
```
**Pregunta de entrevista:** ¿por qué estructural y no por convención? Porque una convención se rompe con prisa; una prueba de arquitectura rompe el build (ADR 0004).
