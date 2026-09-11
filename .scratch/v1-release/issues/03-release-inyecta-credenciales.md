# 03: ci(release) — inyectar credenciales de Google en el build de release

**What to build:** Los binarios de la release pública deben salir con Google Calendar funcional. El workflow de release recibe los repository secrets `VITE_GCAL_CLIENT_ID` y `VITE_GCAL_CLIENT_SECRET` (ya creados por el usuario) y los inyecta en el `env` del step que ejecuta tauri-action, que los propaga al build del frontend donde Vite los inlinea. Ningún `.env` real se commitea jamás.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] El workflow de release define ambas variables en el step de build, tomadas de los secrets del repo.
- [x] Ningún valor real de credenciales aparece commiteado (grep en verde sobre el repo, excluido `.env` gitignored).
- [x] El job de tests del workflow no requiere las variables (el build compila sin ellas; la validación es en runtime).
