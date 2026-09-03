# Spec: Anclaje del preview de resize en modo edición del Dashboard

Status: ready-for-agent
Label: ready-for-agent

## Problem Statement

En el Dashboard, con el modo edición activo, el gesto de redimensionar un widget rompe la experiencia:

- Al arrastrar el handle de resize (agrandar/achicar), los widgets de **Pomodoro**, **Objetivos**, **Tareas** y **Calendario anual** desaparecen durante el arrastre. El widget de **Hábitos** (ubicado en 0,0) es el único que no presenta el problema.
- El **Cronograma semanal**, al redimensionar desde abajo a la derecha, no crece desde la casilla donde estaba: se traslada hacia el centro de la pantalla y el resize continúa desde esa posición desplazada. Al soltar, el widget vuelve a su celda con un salto visible.

Ambos síntomas ocurren solo durante el resize; el drag para mover widgets funciona bien. El usuario confirmó que la desaparición se percibe "recién al arrastrar" y que Hábitos funciona correctamente, lo que coincide con un desplazamiento proporcional a la posición en la grilla.

La causa raíz está en el preview de resize del ítem de la grilla: durante el gesto el ítem se saca del flujo con `position: absolute` conservando su `grid-column`/`grid-row`. Por la spec de CSS Grid, un hijo absoluto con placement definido usa su propia área de grilla como containing block, por lo que `left`/`top` calculados respecto al contenedor se aplican dentro del área → desplazamiento doble `(x/COLS·W, y/ROWS·H)`. Ese desplazamiento coincide exactamente con el patrón observado (widgets en 0,0 no se mueven; el resto salta fuera del viewport y es clippeado).

## Solution

Corregir el anclaje del preview de resize para que el widget permanezca visible y crezca solo hacia la derecha/abajo desde la esquina superior izquierda de su propia casilla, durante todo el gesto y sin salto al soltar.

El fix es mínimo y se limita al comportamiento de preview: el widget no debe desplazarse al iniciar el resize; solo su ancho/alto deben reflejar el gesto. Al soltar, el tamaño se convierte a celdas enteras con la misma semántica de snap y colisión que hoy, y la animación de asentamiento parte del rect correcto.

## User Stories

1. Como persona en modo edición redimensionando cualquier widget, quiero que el widget permanezca visible durante todo el gesto de resize, para saber qué tamaño estoy eligiendo.
2. Como persona redimensionando un widget desde abajo a la derecha, quiero que su esquina superior izquierda permanezca fija en la casilla donde estaba, para que el crecimiento sea predecible.
3. Como persona redimensionando el widget de Pomodoro en modo edición, quiero ver sus bordes y contenido actualizarse de forma continua sin que desaparezca, para confirmar el nuevo tamaño antes de soltar.
4. Como persona redimensionando el widget de Objetivos, quiero el mismo comportamiento continuo y visible que en cualquier otro widget.
5. Como persona redimensionando el widget de Tareas, quiero el mismo comportamiento continuo y visible.
6. Como persona redimensionando el widget de Calendario anual, quiero el mismo comportamiento continuo y visible.
7. Como persona redimensionando el widget de Cronograma semanal desde abajo a la derecha, quiero que no se traslade hacia el centro de la pantalla, sino que crezca desde donde estaba.
8. Como persona que suelta el handle de resize del Cronograma semanal, quiero que no haya un salto hacia el centro al asentar el nuevo tamaño.
9. Como persona redimensionando el widget de Hábitos (control en 0,0), quiero que siga funcionando como hasta ahora, sin regresión.
10. Como persona que cancela un resize sin mover el puntero, quiero que el widget quede exactamente como estaba, sin desplazamiento ni cambio de tamaño.
11. Como persona que hace un resize pequeño (un arrastre corto), quiero que el widget crezca o achique proporcionalmente al movimiento del puntero, sin saltos iniciales.
12. Como persona que hace un resize grande (arrastre largo), quiero que el widget siga anclado y solo cambie su ancho/alto, sin desplazarse.
13. Como persona que redimensiona y suelta, quiero que el tamaño final respete los mínimos del widget y el clamping al contenedor, igual que hoy.
14. Como persona que redimensiona cerca de otro widget, quiero que las reglas de colisión sigan impidiendo el solapamiento, igual que hoy.
15. Como persona que mueve un widget (drag) en modo edición, quiero que esa interacción siga funcionando sin cambios.
16. Como mantenedor, quiero cobertura de regresión en el seam más alto que reproduzca el anclaje del preview, para que un cambio futuro no reintroduzca el desplazamiento.

## Implementation Decisions

- El cambio es solo frontend. No se tocan comandos de Tauri, esquema de SQLite, migraciones ni contratos de persistencia. Toda la lógica vive en TypeScript/Vue, respetando la regla de oro del proyecto (Rust solo infraestructura de persistencia) y el ADR del Dashboard con grilla nativa en enteros.
- El seam principal es el wrapper de ítem de la grilla del Dashboard (el componente que envuelve cada widget, hoy responsable del preview de drag/resize y de la animación FLIP al soltar). Es el único seam que debe cambiar; no se crean seams nuevos. El contrato genérico de `deltaRect` de interact.js se conserva tal cual.
- Durante el preview de resize el ítem debe permanecer anclado a su casilla: su esquina superior izquierda no se reposiciona. Solo su ancho/alto en píxeles reflejan el gesto. Al soltar, se limpia el estilo temporal y el layout vuelve a resolverse por `grid-column`/`grid-row` en enteros.
- Para evitar cualquier dependencia de la matemática de gap en el anclaje, el tamaño base del preview se toma del rect medido del elemento al iniciar el gesto, y se le suma el delta acumulado del gesto. Esto garantiza que al presionar el handle sin mover aún no haya salto de tamaño.
- El snap a celdas al soltar y las validaciones de `minW`/`minH`, clamping y colisión permanecen en el store del Dashboard con la misma semántica actual; no se cambia el modelo de datos del layout (enteros sobre 12×10) ni el algoritmo de `findFreePosition`.
- El drag (mover) no se modifica: sigue usando `transform` durante el gesto y snap al soltar.
- El trabajo en progreso sin commitear en el worktree (widget Pomodoro y cambios asociados) no se toca; el fix vive en el wrapper genérico y es compatible con ese WIP. La spec previa `.scratch/pomodoro-bugfix` asumía que la capa genérica estaba verificada y acotaba el fix al seam del widget; este repro demuestra que la capa genérica es la responsable, satisfaciendo la propia cláusula de salida de esa spec.

## Testing Decisions

- Qué hace un buen test en este proyecto: probar comportamiento externo observable (props/emit y rect visible), no detalles de implementación interna. Los tests de componentes usan `@vue/test-utils` vía props y eventos; los de store prueban lógica de dominio pura con `vi.mock` del IPC.
- Seam principal para la regresión: el wrapper de ítem de la grilla, que es el nivel más alto que reproduce el bug con un solo gesto. Prior art: el suite existente del wrapper que ya cubre render de `grid-column`/`grid-row`, emisión de `moved`/`resized`, clase de dragging y FLIP (con mocks de los composables de drag y flip).
- Se corrige primero el test que hoy codifica el comportamiento roto (el preview durante resize) para que vaya rojo, luego se aplica el fix para que vaya verde. El test WIP sin trackear del widget Pomodoro que aserta el mismo preview roto se actualiza al nuevo contrato en el mismo paso.
- Para cubrir la semántica real de layout del navegador (el containing block de un absoluto en grilla no se reproduce en happy-dom), se agrega una regresión e2e con Playwright/Chromium que reuse el webServer y el stub de IPC ya existentes del harness de rendimiento (`?perf=1` con layout fijado). Esa regresión abre el Dashboard en modo edición, presiona el handle derecho/abajo de widgets en posiciones representativas (incluyendo 0,0 como control), arrastra y aserta: el rect no se desplaza al presionar, el contenido sigue visible en viewport, y al soltar el tamaño final es el snapeado esperado. Es el feedback loop rojo/verde de la skill de diagnóstico.
- El store del Dashboard mantiene su suite existente de defaults, migración, clamping, colisión y persistencia como regresión de la semántica de grilla. Prior art: el test del store que ya cubre esos casos.
- Verificación tras el fix: suite unitaria completa y build de producción en verde. Al tocar el Dashboard/la grilla, el presupuesto de rendimiento del Dashboard (`test:perf`) debe seguir verde según el Definition of Done.

## Out of Scope

- Correcciones de pulido menor detectadas en el mismo código pero no reportadas: drift de ~2-3px por el gap de 4px en la matemática de snap, y `transform-origin` del FLIP al soltar. El usuario eligió explícitamente "solo los bugs reportados".
- Cambios en el motor de drag (interact.js), en la persistencia Rust/SQLite, en el esquema de layout o en `findFreePosition`/`wouldCollide` más allá de lo necesario para el anclaje.
- Rediseño visual de widgets, nuevos widgets, o cambios de copy/espaciado sin lógica testeable.
- Reemplazo del sistema de audio, notificaciones nativas o implementación de audio en Rust.
- Virtualización de listas internas de widgets pesados o cualquier optimización del harness de rendimiento más allá de mantener el presupuesto.

## Further Notes

- Vocabulario del dominio según `CONTEXT.md`: Widget, Dashboard, Cronograma semanal, Bloque, Slot. Evitar sinónimos (contenedor, módulo, tarjeta, horario, agenda).
- El layout del Dashboard es CSS Grid nativo `repeat(12, 1fr)` / `repeat(10, 1fr)` con `gap: 4px`; cada widget se posiciona con `grid-column`/`grid-row` en enteros (ADR 0004). El fix respeta ese modelo y no reintroduce JS en el loop de layout.
- El bug fue introducido con el rewrite de la grilla a enteros; el drag no lo sufre porque usa `transform`. La confirmación diferencial es que Hábitos en (0,0) funciona: el desplazamiento doble es cero solo ahí.
- La regresión e2e reuse el patrón existente de `tests/perf` (Chromium aislado, IPC de Tauri stubeado, viewport controlado) para no duplicar harness.
