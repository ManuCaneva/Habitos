# 06: Limpieza — credenciales muertas y flujo de deep-link fuera del OAuth

**Status:** done

**What to build:** Borrar todo lo que quedó muerto o inconsistente después de 01–05, para que el repo no arrastre credenciales huérfanas ni dos mecanismos de callback. Sin cambio de comportamiento.

**Blocked by:** 03 (necesita que el flujo nuevo esté en su lugar para no borrar algo vivo). Paralelizable con 04 y 05.

## Qué entrega

1. **Fuera el scheme huérfano del client iOS**: la config de deep-link registra el reverse-DNS de un client distinto al que usa la app (el del `.env`), junto al scheme propio de la app. El del client iOS queda fuera de la config desktop.
2. **Fuera el secret del entorno**: `VITE_GCAL_CLIENT_SECRET` se elimina del archivo de entorno (ya sin lectores desde 01/03). Deja de viajar dentro del bundle de cada instalación — era extraíble.
3. **Fuera el MimeType huérfano del launcher local**: el archivo `.desktop` de desarrollo registra el scheme del client iOS como handler; sin OAuth por deep-link, ese MimeType queda fuera (queda el scheme propio de la app sin uso OAuth; decisión del grill: el plugin deep-link permanece instalado para usos futuros).
4. **Fuera el schema de config de calendario sin uso**: el schema Zod de configuración que nadie referencia se borra.
5. **Alineación final de tests**: la suite completa refleja los contratos nuevos (payloads sin secret, parser canónico, scope completo).

## Acceptance criteria

- [x] No existe referencia al client huérfano (`...-e3c45...`) en la config desktop ni en el launcher.
- [x] El secret no aparece en el archivo de entorno ni en ningún módulo del frontend (grep en verde).
- [x] El schema Zod muerto no existe.
- [x] `npm run test`, `npm run lint`, `npm run build` en verde.
- [ ] `npm run format:check` queda bloqueado por dos documentos `.scratch` preexistentes y no relacionados: `.scratch/cronograma-pulida/issues/03-modal-lista-horarios-guardar.md` y `.scratch/gcal-oauth-fix/spec.md`.
- [x] `cargo check`, `cargo fmt --check`, `cargo clippy` en verde.
- [x] Un build frontend de producción no contiene el secret (verificación de grep sobre `dist`).

## Notas

- Ticket mecánico de contracción (expand–contract: el expand fue 01–03, este es el contract).
- El `.desktop` vive fuera del repo (en `~/.local/share/applications/`): la edición es local al equipo de desarrollo, documentada en el ticket, no commiteada.
