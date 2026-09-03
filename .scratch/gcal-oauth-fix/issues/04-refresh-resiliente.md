# 04: Refresh resiliente — solo la revocación mata la sesión

**Status:** done

**What to build:** Que una falla transitoria de red o de Google no desconecte al usuario. Hoy, cualquier respuesta no-OK del refresh borra los tokens y baja el flag de conexión: un 429 de quota o un 5xx destruye la sesión silenciosamente (parte de la historia de "conectó y después murió"). El estado conectado pasa a reflejar salud, no intención.

**Blocked by:** 03 (usa el store reescrito y sus refs de error separadas)

## Qué entrega

1. **Clasificación de fallos del refresh**:
   - `invalid_grant` (refresh token revocado/expirado — incluye la muerte a 7 días del modo Testing) → recién ahí se borra la sesión: tokens fuera, `connected=false`, error de conexión visible explicando que hay que reconectar.
   - 429, 5xx, timeout, red caída → se lanza un error de sync temporal manteniendo tokens y `connected=true`; el próximo intento reintenta.
2. **Single-flight del refresh**: refrescos concurrentes (navegación rápida de años dispara syncs paralelos) comparten la misma promesa en curso — un solo POST al token endpoint y un solo `persistTokens`, sin riesgo de persistir un par access/expiry inconsistente.
3. **El error de refresh transitorio es visible**: aparece como error de sync (no de conexión) y desaparece cuando un sync posterior tiene éxito — distinto del error de conexión persistente de 03.

## Acceptance criteria

- [x] TDD: tests rojos primero — refresh con respuesta 429 mantiene tokens y `connected=true` (hoy los borra); 500 ídem; `invalid_grant` borra sesión y muestra error con instrucción de reconectar; dos syncs concurrentes con token vencido producen **una** llamada al token endpoint (mock cuenta llamadas).
- [x] La promesa single-flight se resuelve para todos los que la esperan y limpia su estado interno tras éxito/fallo (sin quedar pegada tras un fallo transitorio).
- [x] `npm run test` y `npm run build` en verde.

## Notas

- Seam: store del calendario, mock del fetch HTTP (prior art: tests del store que mockean respuestas de Google).
- Los payloads del refresh ya no llevan secret (viene de 01); este ticket no toca builders.
