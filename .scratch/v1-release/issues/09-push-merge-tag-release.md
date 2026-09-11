# 09: chore(git) — push a dev, merge a main y tag v1.0.0

**What to build:** Con todo commiteado y el CI localmente en verde, subir la rama de desarrollo, integrarla en `main` y etiquetar `v1.0.0` para que el workflow de release publique los binarios con Google Calendar funcional. Verificar que el release generado exista y que el job de build haya tenido acceso a las credenciales.

**Blocked by:** 01 (fix OAuth), 02 (supersesión), 03 (inyección de credenciales), 04 (licencia y env example), 05 (formato), 06 (cronograma), 07 (readme), 08 (bump de versión).

**Status:** done

- [x] `npm run test`, `npm run build`, `npm run lint` y `npm run format:check` en verde antes del push.
- [x] Push a `dev` completo (sin trabajo pendiente en el árbol).
- [x] Merge a `main` y push.
- [x] Tag `v1.0.0` creado sobre `main` y pusheado.
- [x] El workflow de release corre en verde y publica binarios para las tres plataformas.
- [x] Smoke test del binario: conectar Google Calendar, carga de eventos del año y refresh de token funcionan.
