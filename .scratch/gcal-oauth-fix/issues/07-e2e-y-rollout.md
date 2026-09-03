# 07: Verificación E2E y rollout — publicar el consent screen y reconectar

**Status:** ready-for-human

**What to build:** La verificación end-to-end con cuenta real de Google y las acciones de rollout en Google Cloud Console que solo el humano puede hacer. Sin esto, el código de 01–06 está verde pero el producto no llega a los usuarios (el modo Testing mata los refresh tokens a los 7 días: la causa histórica de "conectó y después murió sola").

**Blocked by:** 04, 05, 06 (todo el código en su lugar)

## Qué entrega

### Parte A — Verificación manual con la app (agent-friendly si hay cuenta disponible)

1. `npm run tauri dev` → Settings → Conectar → el navegador abre el consent → autorizar → la app muestra Connected.
2. La tabla de config en `~/.local/share/com.aeon/aeon.sqlite` tiene `gcal_access_token` y `gcal_refresh_token` **con contenido** (no vacíos como hoy).
3. El calendario anual del dashboard muestra los dots de los eventos reales de Google del año en curso.
4. CRUD desde el modal de detalle del día: crear un evento aparece en Google Calendar, editar y borrar se reflejan.
5. Desconectar → Conectar de nuevo funciona (segunda conexión: valida el one-shot/puerto dinámico del servidor loopback).
6. Conectado, bloquear la red (o desconectar WiFi) → sync falla con error visible pero **no** desconecta; red vuelve → sync exitoso limpia el error.
7. Presupuesto de rendimiento del dashboard verde tras el flujo completo.

### Parte B — Google Cloud Console (solo humano)

1. Publicar la app OAuth **In production** (Google Auth Platform → Publish app). Consecuencia aceptada en el grill: los usuarios verán el aviso amarillo "App no verificada" (scope sensitive) y podrán continuar vía "Avanzado → Continuar". La verificación de marca formal queda out of scope.
2. Reconectar la sesión personal (el refresh token creado en Testing muere una vez más; tras reconectar, ya no expira a 7 días).
3. No tocar nada en el client tipo Escritorio (no requiere redirect URIs registradas — lo validó la conexión real).

## Acceptance criteria

- [ ] Los 7 puntos de la Parte A verificados y anotados en comentarios del ticket.
- [ ] La app publicada In production (captura o estado visible en la consola).
- [ ] Una conexión nueva post-publicación funciona sin el límite de 7 días (el refresh token sobrevive).
- [ ] Si Google rechazara el puerto dinámico del loopback (no esperado: el client Desktop lo permite), fallback documentado: puerto fijo 14202 y volver a 02/03 — decisión registrada en este ticket.

## Notas

- Etiqueta `ready-for-human`: requiere la cuenta de Google del dueño del proyecto y la consola de Cloud. La Parte A puede ejecutarla el agente junto al usuario, Parte B es exclusivamente humana.
- Es el cierre del ciclo que empezó con el reporte "conecta pero no funciona ni aparecen eventos": esta verificación reproduce exactamente ese escenario y confirma que quedó resuelto.
