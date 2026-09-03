# Spec: Integración confiable con Google Calendar (OAuth loopback sin secret + errores visibles)

Status: ready-for-agent
Label: ready-for-agent

## Problem Statement

Un usuario de AEON intenta conectar su cuenta de Google Calendar desde Settings para ver sus
eventos en el calendario anual del dashboard. El flujo aparenta funcionar: el navegador muestra
la pantalla de consentimiento de Google, el usuario autoriza, y aparece una página que dice
"¡Inicio de sesión completado!". Pero al volver a la app, Settings sigue mostrando "Not
connected" en rojo y el calendario anual no muestra ningún evento de Google — silencio
absoluto, sin ningún mensaje de error que indique qué falló.

El problema tiene tres capas verificadas:

1. **Histórica**: la app OAuth de Google está en modo Testing, donde los refresh tokens expiran
   a los 7 días. La sesión del usuario murió sola una vez conectada (la base de datos local
   conserva las claves de tokens vacías, firma del borrado automático que hace la app ante
   cualquier fallo de refresh).
2. **Actual (bloquea reconectar)**: el callback OAuth llega a la app pero nunca completa la
   conexión. Dos defectos lo explican: el código de autorización viaja percent-encodeado y el
   servidor local de OAuth lo parsea a mano sin decodificar (double-encoding al enviarlo a
   Google), y el estado pendiente del flujo vive solo en memoria del webview, por lo que
   cualquier recarga entre consentimiento y callback hace que el callback entrante se ignore.
3. **De UX/diagnóstico**: todos los caminos de fallo son silenciosos — la página de éxito del
   navegador se muestra antes de saber si el intercambio funcionó, los errores por calendario
   en la sincronización se tragan, los errores de conexión se limpian a los segundos, y un
   "Connected" en la UI puede significar "tengo tokens guardados" en vez de "la sesión sirve".

Además hay credenciales inconsistentes: conviven dos client IDs de Google distintos en la
configuración (uno en el entorno de la app, otro como scheme de deep-link registrado), el
client secret está embebido en el bundle del frontend, y la implementación se desvió del spec
original del widget (que preveía PKCE sin secret y solo lectura).

## Solution

Un flujo de conexión con Google Calendar que funciona de punta a punta en dev y en producción
con un único mecanismo (servidor loopback), sin client secret embebido, y que nunca miente:
la página del navegador solo anuncia éxito cuando la app realmente conectó, la UI distingue
"esperando autorización" de "conectado" y de "error", y cualquier fallo — de conexión o de
sincronización — queda visible hasta que algo lo resuelve. Las sesiones sobreviven a fallos
transitorios de red/cuota y solo se destruyen ante revocación real. Los usuarios finales pueden
conectar de forma permanente (app publicada en producción en Google Cloud Console).

## User Stories

1. Como usuario de AEON, quiero conectar mi cuenta de Google Calendar desde Settings, para ver
   mis eventos en el calendario anual del dashboard.
2. Como usuario que completa el consentimiento en el navegador, quiero que la app quede
   conectada automáticamente al volver, para no repetir pasos ni copiar códigos a mano.
3. Como usuario, quiero que la página del navegador solo diga "inicio de sesión completado"
   cuando el intercambio de tokens realmente terminó bien, para no confiar en un estado falso.
4. Como usuario que acaba de hacer clic en Conectar, quiero ver en Settings un estado
   "Esperando autorización en el navegador…", para saber que la app está esperando el callback
   y no que se colgó.
5. Como usuario cuyo callback llega con un estado (state) inválido, vencido o inesperado,
   quiero ver un error claro y persistente en Settings, para saber que tengo que reintentar
   en vez de quedarme en silencio.
6. Como usuario cuya ventana se recarga (o recibe hot-reload en dev) entre el consentimiento
   y el callback, quiero que la conexión igualmente se complete, para no empezar de nuevo.
7. Como usuario cuyo refresh token fue revocado o expiró, quiero ver un mensaje claro y el
   estado "Desconectado", para saber que debo reconectar y no un "Connected" mentiroso.
8. Como usuario con red inestable o cuota temporaria de Google excedida, quiero que la app
   conserve mi sesión ante fallos transitorios (rate limit, errores de servidor de Google),
   para no tener que reconectarme por una falla pasajera.
9. Como usuario, quiero que los eventos de mis calendarios de Google aparezcan como puntos de
   color en el calendario anual, para ver mi año de un vistazo.
10. Como usuario con varios calendarios, quiero saber cuándo alguno no pudo sincronizarse,
    para entender por qué faltan eventos en lugar de ver un calendario a medias sin aviso.
11. Como usuario, quiero que un error de sincronización permanezca visible hasta que una nueva
    sincronización lo resuelva, para que el aviso no desaparezca a los segundos.
12. Como usuario, quiero que los errores de conexión (OAuth) y los de sincronización (API de
    Calendar) se muestren por separado, para diagnosticar sin ambigüedad.
13. Como usuario que crea, edita o borra eventos desde la app, quiero que esos cambios se
    escriban en mi Google Calendar, para mantener ambos lados sincronizados.
14. Como usuario que desconecta su cuenta, quiero que se revoque el acceso y se limpie todo
    estado local (tokens, eventos, estado pendiente), para que no queden restos de mi cuenta.
15. Como usuario nuevo que instala la app publicada, quiero poder conectar sin que mi sesión
    expire a los 7 días, para que la integración sea permanente.
16. Como usuario que ve la advertencia "app no verificada" de Google, quiero que el flujo siga
    siendo completable (Avanzado → Continuar), para conectarme igual.
17. Como usuario, quiero que mi instalación no contenga credenciales secretas de la app
    embebidas, para que la distribución no filtre el client secret.
18. Como usuario, quiero que al fallar la apertura del servidor de autorización local se me
    avise en la UI, para saber que el intento de conexión no va a funcionar.
19. Como mantenedor, quiero que el servidor local de OAuth entregue la query cruda sin
    interpretarla y el parseo canónico viva en un único lugar del frontend, para que la
    decodificación pase exactamente una vez.
20. Como mantenedor, quiero un único mecanismo de callback (loopback) idéntico en dev y en
    producción, para reducir la superficie de bugs y no mantener dos flujos.
21. Como mantenedor, quiero que el puerto del servidor OAuth se elija libre en runtime, para
    evitar colisiones con otros procesos en la máquina del usuario.
22. Como mantenedor, quiero que el estado pendiente del flujo OAuth sobreviva recargas
    persistiéndolo en la base de datos de configuración, para que el callback nunca se pierda
    por un reinicio del webview.
23. Como mantenedor, quiero que los refrescos de token concurrentes se coalescan en uno solo,
    para no persistir pares de tokens inconsistentes.
24. Como mantenedor, quiero que la configuración muerta del flujo anterior (scheme de
    deep-link de un client huérfano, código sin llamadores, schemas sin uso, secret sin uso)
    se elimine, para que el flujo sea comprensible.
25. Como agente implementador, quiero tests rojos que capturen cada defecto listado antes de
    tocar la implementación, para seguir el TDD estricto del proyecto.
26. Como usuario del dashboard, quiero que el rendimiento del calendario anual no se degrade
    con estos cambios, para que el presupuesto de performance se mantenga verde.

## Implementation Decisions

- **Un solo mecanismo de callback: servidor loopback en dev y producción.** El command de Rust
  que levanta el servidor HTTP local pasa a bindear en `127.0.0.1` con puerto dinámico (efímero)
  y a devolver al frontend el redirect URI completo (`http://localhost:{puerto}/oauth-callback`)
  como resultado del invoke. El frontend deja de tener branch dev/prod para el redirect y deja
  de hardcodear el puerto. Si el bind falla, el command devuelve error y `connect()` lo propaga a
  la UI en vez de abrir el navegador igual. El servidor pasa a ser one-shot: atiende el primer
  callback, emite el evento y termina. Solo infraestructura I/O en Rust; cero lógica de negocio
  (regla de oro del proyecto).
- **Decodificación única**: Rust emite el evento de callback con la query cruda sin tocar; el
  parseo canónico (extracción de `code`/`state`/`error`) vive en los helpers puros de OAuth del
  frontend usando `URLSearchParams`, que decodifica exactamente una vez. Se reemplaza al
  parser anterior (que decodificaba cero veces). La página HTML de éxito del navegador se
  sirve solo después de haber emitido el evento.
- **PKCE puro, sin client secret**: los payloads de exchange y refresh dejan de incluir
  `client_secret`. El tipo de client Escritorio de Google lo permite y el spec original del
  widget ya lo preveía. La variable de entorno del secret deja de leerse y se borra del
  entorno. Nada sensible viaja en el bundle.
- **Estado pendiente persistente**: al iniciar `connect()`, el par `{verifier, state,
  redirectUri, createdAt}` se persiste en la tabla de configuración (clave dedicada, no el
  flag booleano suelto) con TTL de 10 minutos. El listener del callback lo lee de ahí. Un
  callback sin pendiente válido, vencido o con state que no coincide produce un error de
  conexión visible — nunca silencio. El pendiente se limpia en éxito y en error.
- **`connected` refleja salud, no intención**: la sesión se destruye (tokens borrados +
  `connected=false`) únicamente ante `invalid_grant`/revocación de Google. Ante rate limit
  (429), errores de servidor (5xx) o fallo de red, el refresh lanza error pero conserva los
  tokens y el estado conectado. Los refrescos concurrentes comparten una única promesa en
  vuelo (single-flight) para no persistir pares inconsistentes.
- **Sincronización sin tragarse errores**: ante 401 en la llamada a la API, se refresca el
  token y se reintenta una vez. Los fallos por calendario dejan de retornar silenciosamente:
  se cuentan y se exponen (ej. "No se pudieron sincronizar N calendarios") junto al resto del
  estado de error de sync.
- **Estados de error separados y persistentes**: nuevo estado de error de conexión, distinto
  del error de sincronización. La sincronización deja de limpiar errores de conexión al montar;
  el widget deja de filtrar/ocultar el caso "Not connected" del banner (ese estado
  contradictorio deja de existir porque `connected` ahora es coherente con los tokens).
- **Estados de UI en Settings**: sin conexión → botón Conectar; flujo iniciado → "Esperando
  autorización en el navegador…"; conectado → punto verde + Desconectar; error de conexión →
  mensaje persistente hasta que un nuevo intento lo resuelva.
- **Limpieza del flujo anterior**: fuera el scheme de deep-link del client huérfano (y su
  MimeType en el archivo desktop local), fuera el listener de deep-link del flujo OAuth (el
  plugin queda instalado para usos futuros ajenos a OAuth), fuera la variante de exchange sin
  validación de state que nadie llama, fuera el schema de configuración de calendario sin uso,
  y alineados los tests del helper de OAuth al scope real de la app (`auth/calendar`
  completo, necesario para el CRUD de eventos; el test viejo esperaba `readonly`).
- **Scope OAuth**: se mantiene el scope completo de Calendar (lectura/escritura) porque el
  modal de detalle de día crea/edita/borra eventos en Google.
- **Publicar en producción (acción humana)**: prerequisite de rollout, no de código. El
  mantenedor publica la app OAuth en Google Cloud Console (Google Auth Platform → Publish
  app). Los usuarios verán la advertencia de app no verificada una vez (scope sensible), pero
  el flujo es completable y las sesiones dejan de expirar a los 7 días. La sesión actual del
  mantenedor (creada en Testing) morirá una última vez; se reconecta tras el fix.
- **Client Escritorio sin redirect URIs registrados**: ya validado en la práctica — el
  redirect loopback de hoy llegó a destino con ese client. No se toca Google Cloud Console
  más allá de publicar.

## Testing Decisions

- **Qué hace un buen test aquí**: probar comportamiento externo observable, no detalles
  internos. Los tests de store ejercitan la lógica de dominio mockeando la capa IPC
  (`vi.mock` de los wrappers de config y de los plugins de Tauri); los tests de componentes
  usan `@vue/test-utils` vía props/emit; nada levanta el runtime de Tauri.
- **Seams (todos existentes, no se crean seam nuevo en el frontend)**:
  1. *Store de calendario* (seam principal, el más alto que reproduce el flujo): tests que
     capturan el listener registrado vía los mocks de los plugins/eventos para simular la
     llegada del callback (casos: query con código decodificado, state inválido, pendiente
     vencido, callback sin pendiente, error de Google en el exchange); refresh resiliente
     (invalid_grant destruye, 429/5xx conserva); single-flight de refresh; sync con fallos
     parciales visibles; 401 → refresh + reintento; disconnect limpia todo. Prior art: el
     suite actual del store, que ya mockea `@/lib/db`, el plugin HTTP y los listeners.
  2. *Helpers puros de OAuth*: parseo de query cruda con `URLSearchParams` (decodificación
     única, casos con `%2F`, sin params, con `error`), auth URL sin `client_secret`, payloads
     sin secret. Prior art: el suite actual de esos helpers (incluye el test de scope a
     alinear).
  3. *Card de Google Calendar en Settings*: estados idle / esperando autorización / conectado /
     error visible y persistente. Prior art: el suite actual de la vista con sus
     `data-testid` de conectar/desconectar.
  4. *Widget de calendario anual*: banner de error de sync persistente (ya no filtra el caso
     especial). Prior art: el suite actual del widget.
  5. *Rust, único test nuevo*: unit test del helper puro que extrae path y query de la línea
     de request HTTP (extraído del command para ser testeable). Prior art: los tests inline
     del módulo de base de datos en Rust.
- **TDD estricto**: primero el test rojo que captura cada defecto (decodificación del code,
  pendiente persistente, refresh resiliente, errores visibles), corerlo fallando por la razón
  correcta, después la implementación mínima para verde. Si hace falta confirmar el
  double-encoding en runtime antes del rojo, un log puntual del callback recibido lo verifica
  en un `tauri dev` manual.
- **Definition of Done**: suite completa verde, build de producción verde, lint y format
  verdes, `cargo check`/`fmt`/`clippy` verdes por tocar Rust, y el presupuesto de rendimiento
  del dashboard (`test:perf`) verde por tocar el widget del calendario anual.

## Out of Scope

- **Verificación de marca de Google** (privacy policy, dominio, video, review): solo se
  publica sin verificación; la advertencia amarilla de "app no verificada" queda aceptada.
  Si más adelante molesta, se abre un esfuerzo propio de verificación.
- **Mover el exchange de tokens a Rust** o encriptar los tokens en reposo: riesgo aceptado en
  el spec original del widget; candidatos a ticket futuro separado.
- **Deep-link como mecanismo OAuth**: queda fuera del flujo (el plugin permanece instalado
  para usos futuros no-OAuth). No se hace spike de scheme custom con Google.
- **Cache persistente de eventos de Google**: los eventos remotos siguen on-demand en memoria
  (decisión del spec original del widget); solo los eventos locales se persisten.
- **Selección/filtro de calendarios a sincronizar**: hoy se sincroniza todo el calendarList;
  elegir cuáles es otro feature.
- **Multi-cuenta / cambio de cuenta de Google**: una sola cuenta conectada por instalación.
- **OAuth incremental o scopes granulares por pantalla**.

## Further Notes

- **Evidencia del diagnóstico** (recolectada en la sesión de grilling): las claves de tokens
  en la base de datos local existen pero están vacías (0 chars) — solo `clearTokens()` las
  escribe así; conviven dos client IDs distintos en el entorno de la app y en la config de
  deep-link; la app OAuth está en Testing con el usuario como test user; el usuario siempre
  corre `npm run tauri dev` y vio la página de éxito del navegador mientras Settings mostraba
  "Not connected" — es decir, el callback llegó al servidor Rust pero el intercambio nunca
  completó en el frontend.
- **Por qué no se distingue aún cuál de los dos defectos bloquea hoy** (double-encoding vs
  pendiente perdido por recarga): ambos se corrigen con el mismo paquete y el primer paso de
  verificación (log del callback) los distingue en minutos; no vale la pena bloquear el plan
  por esa disección.
- **Orden de rollout**: código → verificación E2E manual en `tauri dev` (conectar, ver tokens
  con contenido en la BD, eventos como dots, CRUD desde el modal de día) → publicar la app en
  producción en Google Cloud Console → reconectar la sesión del mantenedor (la actual morirá
  una vez más por el cambio Testing→Producción).
- **Fallback documentado**: si Google rechazara el puerto dinámico del loopback (no debería,
  es el flujo estándar de apps desktop), el fallback es volver a puerto fijo — verificación de
  2 minutos en el paso E2E.
- **Fuente histórica**: el spec original del widget de calendario anual (julio 2026, en
  superpowers/specs) preveía PKCE sin secret, scope readonly y deep-link con fallback a "copia
  manual del code". La implementación se desvió en los tres puntos (secret + scope completo +
  loopback solo en dev); esta spec consolida la desviación de scope (necesaria para el CRUD)
  y revierte las otras dos hacia el diseño original.
