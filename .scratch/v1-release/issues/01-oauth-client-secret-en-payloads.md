# 01: fix(gcal) — enviar client_secret en los payloads OAuth

**What to build:** Al conectar o refrescar la sesión de Google Calendar, el intercambio de código y el refresh deben incluir `client_secret` en el body del POST al token endpoint. Hoy los payload builders lo descartan silenciosamente (el genérico tolera la prop extra pero nunca la lee) y Google responde `client_secret is missing`, rompiendo la conexión. Se commitea el cambio ya presente en el árbol de trabajo junto con sus tests actualizados. No es código nuevo: es consolidar el fix.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Los payloads de token exchange y de refresh incluyen `client_secret`.
- [x] Los tests de los helpers de OAuth asercionan el contrato nuevo (secret presente en ambos payloads).
- [x] `npm run test` en verde.
- [x] No quedan cambios sin commitear en los módulos de OAuth (commit propio, separado de otras features).
