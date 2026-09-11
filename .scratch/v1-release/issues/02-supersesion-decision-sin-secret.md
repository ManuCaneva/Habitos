# 02: docs(oauth) — nota de supersesión de la decisión "sin secret"

**What to build:** La spec de `.scratch/gcal-oauth-fix` decidió "PKCE puro sin client_secret". Esa decisión quedó invalidada empíricamente: contra el token endpoint de Google, un cliente Desktop sin secret responde `invalid_request: client_secret is missing` y con un secret incorrecto responde `invalid_client`; la doc solo exime del secret a clientes Android/iOS/Chrome. Agregar al **inicio** de esa spec una nota corta de supersesión con la evidencia y el estado vigente (secret requerido, viaja embebido). No reescribir el resto de la spec ni sus issues.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] La spec vieja arranca con la nota de supersesión; el resto del documento queda intacto.
- [x] La nota cita la evidencia empírica (errores del token endpoint) y la fecha.
- [x] La nota apunta a dónde quedó documentada la decisión vigente (spec de v1-release / ticket 01).
