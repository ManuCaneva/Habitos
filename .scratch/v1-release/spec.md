# Spec: Release v1.0.0 — cierre de OAuth, packaging y documentación

Status: ready-for-agent
Label: ready-for-agent

## Problem Statement

AEON está funcionalmente completa para una primera versión pública, pero no se puede
publicar: el release que generaría GitHub Actions sale **sin Google Calendar funcional**
(las credenciales no se inyectan en el build), el árbol tiene trabajo sin commitear
(el fix que hace que OAuth realmente funcione), `format:check` está rojo en `main`
(así que el CI de la rama principal falla), no existe `LICENSE.txt` aunque el README
lo promete, falta `.env.example` para quien quiera desarrollar, el README tiene datos
desactualizados ("Próximamente: multi-check-in", que ya está implementado) y es más
denso de lo que corresponde para un proyecto que se quiere compartible. La versión en
los manifiestos es `0.1.0` y no coincide con la release que se quiere etiquetar (`v1.0.0`).

Además, la spec anterior de OAuth (`.scratch/gcal-oauth-fix`) decidió "PKCE puro sin
client_secret". Esa decisión quedó **invalidada empíricamente**: probado contra el token
endpoint de Google con un cliente Desktop recién creado, sin secret responde
`invalid_request: client_secret is missing` y con un secret incorrecto responde
`invalid_client`. La doc de Google solo exime del secret a clientes Android/iOS/Chrome;
el tipo Desktop no está exento. El código actual necesita el secret y por eso el repo
arrastra esa contradicción documental.

## Solution

Cerrar todo lo que falta para etiquetar `v1.0.0` en `main` con un release verde:

- Mantener el cliente OAuth ya configurado (el del `.env`, tipo Desktop) y commitear el
  fix de 4 líneas que envía `client_secret` en los payloads de token exchange y refresh.
- Inyectar las credenciales de Google en el build de release desde GitHub Actions
  secrets (el usuario ya las creó en el repo).
- Dejar `main` con CI verde: formatear los archivos que fallan `format:check`
  (decisión del usuario: formatear, no ignorar en `.prettierignore`).
- Crear `LICENSE.txt` (MIT, copyright `GOYA`) y `.env.example`.
- Reescribir el README: simple, esencial, sin relleno, con paso a paso de desarrollo,
  instrucciones de configuración de Google Calendar y la nota explícita de que el
  client_secret viaja embebido en el binario (no confidencial por política de Google
  para clientes Desktop).
- Anotar la supersesión de la decisión "sin secret" en la spec de OAuth.
- Bump de versión a `1.0.0` en los tres manifiestos para que el tag `v1.0.0` y el
  release generado coincidan.
- Push a `dev`, merge a `main`, tag `v1.0.0`.

## User Stories

1. Como usuario que descarga el binario de la release, quiero que Google Calendar
   funcione al conectar mi cuenta, así que el build de release debe incluir las
   credenciales del cliente OAuth.
2. Como usuario que conecta Google Calendar, quiero que el token se refresque solo
   cuando expira, para no tener que reconectar cada hora.
3. Como usuario que visita el repo, quiero un README corto y directo, para entender en
   un minuto qué es la app, qué hace y si me sirve.
4. Como usuario potencial, quiero instrucciones claras de descarga/instalación, para
   poner la app a correr sin leer la arquitectura.
5. Como desarrollador que clona el repo, quiero un paso a paso de setup (prerrequisitos,
   instalación, corrida de dev), para levantar el entorno sin fricción.
6. Como desarrollador que clona el repo, quiero un `.env.example` que liste las
   variables que la app espera y de dónde salen, para saber qué configurar sin
   adivinar nombres.
7. Como desarrollador que clona el repo, quiero saber cómo se corren los tests y qué
   convención siguen, para contribuir respetando el TDD del proyecto.
8. Como maintainer, quiero que `format:check` pase en `main`, para que el CI de la
   rama principal confíe en verde.
9. Como maintainer, quiero un `LICENSE.txt` MIT real con copyright de GOYA, para que
   la licencia declarada en el README exista y el proyecto sea legalmente compartible.
10. Como maintainer, quiero que el README documente que el client_secret viaja embebido
    en el binario y por qué es aceptable, para que la decisión esté explícita y no
    parezca un descuido de seguridad.
11. Como maintainer, quiero que la versión de los manifiestos sea `1.0.0`, para que
    tauri-action genere el release `v1.0.0` que coincide con el tag.
12. Como maintainer, quiero que el fix de OAuth esté commiteado con sus tests, para
    que el flujo sin secret roto no vuelva a introducirse por accidente.
13. Como maintainer (futuro) o agente, quiero una nota de supersesión en la spec de
    OAuth, para no volver a intentar la vía "sin secret" que ya se descartó empíricamente.
14. Como agente AFK que implemente tickets de esta spec, quiero que cada ticket sea
    verificable con comandos (`test`, `build`, `lint`, `format:check`), para poder
    terminar sin ambigüedad.
15. Como usuario de la app, quiero que el push/merge no rompa nada existente, para
    seguir usando la app como la venía usando (nada de comportamiento nuevo en UI).

## Implementation Decisions

- **Cliente OAuth**: se mantiene el cliente ya configurado en el entorno local (el que
  está en `.env`), tipo Desktop, con su `client_id` y `client_secret`. No se adopta el
  cliente Desktop nuevo creado para el experimento (queda como recurso sin uso).
- **El secret es obligatorio**: decisión de diseño reversible solo si Google cambia su
  política. `client_secret` viaja en los payloads de token exchange y de refresh; eso ya
  está implementado en el árbol de trabajo y se commitea junto con sus tests.
- **Secrets en GitHub**: el usuario ya creó `VITE_GCAL_CLIENT_ID` y
  `VITE_GCAL_CLIENT_SECRET` como repository secrets. El workflow de release debe
  inyectarlos en el `env` del step que ejecuta tauri-action; tauri-action los propaga al
  comando de build del frontend y Vite los inlinea. No se commitea ningún `.env` real.
- **Versionado**: bump de `0.1.0` a `1.0.0` en los tres manifiestos (frontend, config de
  Tauri, crate de Rust). El tag es `v1.0.0` y la release que genera tauri-action toma la
  versión de la config de Tauri, así que deben coincidir.
- **Formato**: se formatean los archivos que fallan `format:check` (las dos páginas
  estáticas legales y los tres documentos del tracker local). No se agregan entradas a
  `.prettierignore` (decisión del usuario). El `.prettierignore` del árbol se restaura a
  su estado commiteado.
- **LICENSE**: MIT con `Copyright (c) 2026 GOYA` (seudónimo, decisión del usuario).
- **README**: reescritura con enfoque "esencial": qué es, qué incluye, stack en una
  línea, descarga de la release, setup de desarrollo paso a paso, configuración opcional
  de Google Calendar (cómo crear el cliente Desktop, qué poner en `.env`, nota de que el
  secret se embebe en el binario), comandos de tests, roadmap mínimo y licencia. Sin
  secciones de "por qué" extensas ni features "próximamente" que ya existen; el roadmap
  refleja el estado real (multi-check-in ya implementado).
- **Docs de OAuth**: la spec de `.scratch/gcal-oauth-fix` recibe una nota de supersesión
  al inicio: la decisión "sin secret" quedó invalidada por prueba empírica contra el
  token endpoint; el flujo vigente usa secret. No se reescribe la spec vieja.
- **Tests**: los helpers de OAuth ya tienen suite propia; se actualizan las aserciones
  para exigir `client_secret` en ambos payloads (comportamiento commiteado, no nuevo).
- **Ramas**: se commitea en `dev`, push, merge a `main` y tag `v1.0.0` en `main`.

## Testing Decisions

- Seam de comportamiento OAuth: la suite existente de los helpers de OAuth (payload
  builders) es el seam más alto y ya existe; se verifica que los payloads incluyan
  `client_secret`. No se agregan seams nuevos.
- Seam de integración de credenciales en release: verificación manual/documental — el
  workflow inyecta los secrets; solo se valida en el primer release real (no hay mock del
  runner de GitHub en la suite).
- Seam de CI verde: `npm run test`, `npm run build`, `npm run lint`,
  `npm run format:check` y, si se toca Rust, `cargo check`/`cargo fmt --check`/
  `cargo clippy` deben pasar. Es la definición de "listo" de esta spec.
- Smoke test del flujo real (conectar Google Calendar, carga de eventos y refresh) se
  hace con `npm run tauri dev` contra el `.env` local. El cambio de versión no invalida
  la sesión existente porque el cliente OAuth no cambia.

## Out of Scope

- **Mejora integral de la UI/UX del frontend** (explícitamente post-release).
- Firma de binarios y notarización (macOS Gatekeeper / Windows SmartScreen seguirán
  avisando; se puede documentar en el body del release más adelante).
- Verificación de marca/app en Google (dominio propio, Search Console, revisión de
  scopes): la app queda en producción con el tope de 100 usuarios y pantalla de
  "app no verificada"; el usuario lo aceptó.
- Onboarding, kanban, tags/prioridades en tareas, calendario integrado, proyectos,
  notas, gamificación, plugins (roadmap posterior).
- Cambios de comportamiento en la app: esta spec no agrega features ni toca la UI.
- Migración al cliente Desktop nuevo creado para el experimento (queda sin uso).

## Further Notes

- Evidencia empírica de la imposibilidad del flujo sin secret (2026-09-11): token
  endpoint con cliente Desktop nuevo → sin secret: `invalid_request: client_secret is
missing.`; con secret arbitrario: `invalid_client: The provided client secret is
invalid.`; con secret correcto: la autenticación del cliente pasa (avanza a
  `invalid_grant` por el código de prueba). Conclusión: el tipo Desktop exige secret.
- El client_secret de un cliente Desktop se considera **no confidencial** según el
  modelo de Google para apps instaladas; embeberlo en el binario es el patrón esperado.
  Riesgo acotado: tope de 100 usuarios y rotación del secret ante abuso.
- Los secrets de GitHub ya fueron creados por el usuario (Fase 1 completada fuera del
  código). Los tickets asumen que existen.
- El árbol de trabajo trae además la feature de días habilitados del cronograma
  (`enabled_days`) con sus tests; se commitea como ticket propio, separado del fix de
  OAuth, para que el historial quede limpio.
