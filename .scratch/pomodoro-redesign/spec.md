# Rediseño Pomodoro: página sin scroll y widget simplificado

Status: done
Label: done

## Problem Statement

La Vista Pomodoro actual es una columna centrada con scroll vertical (`overflow-y-auto`) donde el temporizador y el panel de configuración se apilan uno debajo del otro. En ventanas de escritorio esto obliga a scrollear para ver la configuración aunque haya espacio horizontal disponible.

El widget de Pomodoro del Dashboard muestra el texto de fase ("Enfoque" / "Descanso corto" / "Descanso largo"), un botón "Iniciar"/"Pausar" separado y navega a la Vista Pomodoro al hacer click en cualquier parte del widget. La persona usuaria reporta que la fase textual ensucia el widget, que el botón ocupa espacio innecesario y que la navegación involuntaria al hacer click en el widget es molesta: quiere que el widget sea simplemente el círculo con el tiempo.

## Solution

Rediseñar la Vista Pomodoro como una página única sin scroll en tamaño normal: el temporizador (anillo, cuenta regresiva, puntos de ciclo y controles) queda a la izquierda y el panel de configuración existente queda a la derecha, lado a lado, centrados verticalmente. En ventanas angostas el layout colapsa a una sola columna y recupera el scroll solo como fallback. Se elimina el título superior de la vista.

Simplificar el widget del Dashboard: quitar el texto de fase y los botones Iniciar/Pausar, dejar solo el círculo con la cuenta regresiva y un icono pequeño play/pause siempre visible sobre el círculo, hacer que el click en el círculo alterne iniciar/pausar (con preparación de audio best-effort como hoy), eliminar completamente la navegación a la Vista Pomodoro desde el widget, y colorear el anillo según la fase (enfoque con el token primario, descansos con el token de éxito). La franja superior "Pomodoro" del widget se mantiene.

Todo es frontend (Vue + Pinia + tokens existentes). No hay cambios en Rust, persistencia, store, schemas, sonidos ni duraciones.

## User Stories

1. As a person opening the Pomodoro view on a normal desktop window, I want to see the timer and the settings side by side without scrolling, so that everything fits in one screen.
2. As a person viewing the Pomodoro page, I want the timer (ring, countdown, cycle dots and controls) on the left and the settings panel on the right, so that the layout uses horizontal space.
3. As a person on a narrow window, I want the page to collapse to a single column and allow scrolling as a fallback, so that nothing is clipped.
4. As a person viewing the Pomodoro page, I want no large heading at the top, so that vertical space is used by the timer and settings.
5. As a person using the Pomodoro page, I want the existing controls (Iniciar/Pausar, Saltar, Reiniciar) and cycle dots to remain under the timer on the left, so that my workflow does not change.
6. As a person using the Pomodoro page, I want the settings panel to look exactly as before, only relocated to the right column, so that I do not need to relearn it.
7. As a person viewing the Pomodoro widget on the dashboard, I want to see only a circle with the countdown, so that the widget is minimal.
8. As a person viewing the Pomodoro widget, I want no phase text ("Enfoque") displayed, so that the widget is cleaner.
9. As a person viewing the Pomodoro widget, I want no separate Iniciar/Pausar button, so that the widget is not cluttered.
10. As a person interacting with the widget, I want clicking the circle to toggle between starting and pausing the session, so that one gesture controls the timer.
11. As a person clicking the widget circle to start, I want the audio context to be prepared best-effort before starting, so that the end-of-phase chime will sound without blocking the start if audio fails.
12. As a person viewing the widget, I want a small play/pause icon always visible on the circle (play when paused, pause when running), so that I can tell the state at a glance without hovering.
13. As a person viewing the widget, I want the ring color to reflect the phase (primary token for focus, success token for breaks), so that I can distinguish focus from rest without text.
14. As a person clicking anywhere on the widget outside the circle (including the "Pomodoro" header strip), I want nothing to navigate to the Pomodoro view, so that clicks are not surprising.
15. As a person using the keyboard, I want the widget circle to be reachable as a button with an accessible label ("Iniciar Pomodoro" / "Pausar Pomodoro"), so that the toggle is operable without a mouse.
16. As a person who uses the sidebar, I want to continue reaching the Pomodoro view via the Sidebar entry, so that navigation is still available after removing it from the widget.
17. As a person viewing the widget, I want to keep the "Pomodoro" header strip at the top, so that the widget remains identifiable and consistent with other widgets.
18. As a person viewing the widget, I want the progress ring to remain visible and to convey progress, so that the compact view is still informative.
19. As a maintainer, I want no new design tokens, no new dependencies, and no changes to the timer domain logic or persistence, so that the change is purely presentational.

## Implementation Decisions

- El cambio es solo presentacional en dos superficies: el widget del Dashboard y la Vista Pomodoro. No se modifica el store de Pomodoro, los schemas Zod, los helpers puros de tiempo/fase, los sonidos ni la persistencia de configuración/sesión.
- Widget: se elimina la navegación. Se quitan el handler que cambia el modo de vista, el uso del store de UI dentro del widget, y los atributos de navegación del contenedor (rol de botón, tabindex, cursor de puntero y handlers de click/teclado en el root). Ninguna parte del widget navega; la entrada a la Vista Pomodoro queda solo por la Sidebar.
- Widget: se elimina la fila superior que contenía el texto de fase y los botones Iniciar/Pausar. El header "Pomodoro" permanece como franja estática no clickeable.
- Widget: el círculo pasa a ser el control. Es un elemento botón accesible cuyo click alterna pausa/inicio (si está corriendo pausa, si está pausado prepara audio best-effort y luego inicia). El botón lleva aria-label dinámico según el estado. El anillo de progreso y la cuenta regresiva se mantienen dentro del círculo; el anillo conserva su rol de progressbar con aria-valuenow para no romper el contrato de accesibilidad existente.
- Widget: el color del anillo es derivado del estado de fase. Enfoque usa el token primario, descansos (corto y largo) usan el token de éxito. Se reutilizan tokens ya definidos en todos los temas (oscuro, claro, popi); no se agregan tokens nuevos ni colores hardcodeados.
- Widget: sobre el círculo se muestra un icono pequeño siempre visible (play cuando está pausado, pause cuando está corriendo), centrado de forma discreta junto a la cuenta regresiva, sin depender de hover.
- Vista Pomodoro: se elimina el título superior. El layout pasa a dos columnas a altura completa: columna izquierda con la tarjeta del temporizador (fase, anillo, puntos de ciclo y controles Iniciar/Pausar/Saltar/Reiniciar sin cambios) y columna derecha con el panel de configuración existente sin cambios visuales. En tamaño normal la página no scrollea; por debajo de un breakpoint colapsa a una columna y recupera scroll vertical como fallback.
- El store sigue siendo el único seam que conoce la máquina de fases y el timing basado en marcas de tiempo; los componentes solo leen estado y llaman acciones.
- No se introducen nuevas dependencias, tokens de diseño ni cambios de arquitectura de navegación o grilla del Dashboard más allá de registrar el mismo widget con nueva presentación.

## Testing Decisions

- Qué hace un buen test aquí: probar comportamiento externo observable (texto renderizado, presencia/ausencia de elementos, colores del anillo vía tokens, aria-labels, y que un click en el círculo llame a start/pause y no navegue), no detalles de implementación (nombres de computadas, clases internas, estructura exacta del DOM).
- Seam principal: el store de Pomodoro se mockea en los tests de componentes siguiendo la convención existente (`vi.mock` del módulo de acceso a datos). Los helpers puros y el store no necesitan cambios de tests porque la lógica de dominio no cambia.
- Módulos a testear:
  - Widget del Dashboard: que no hay texto de fase ni botones Iniciar/Pausar; que el header permanece; que el círculo es clickeable y alterna start/pause (incluyendo el prepareAudio best-effort al iniciar); que ningún click navega; que el icono play/pause refleja el estado; que el anillo usa token primario en enfoque y token de éxito en descansos; que el círculo expone rol progressbar y cuenta regresiva. Tests de resize del widget siguen pasando (header, cuenta regresiva y anillo montados durante resize).
  - Vista Pomodoro: que no hay heading; que temporizador y panel de configuración se renderizan juntos; que los controles y puntos de ciclo siguen disponibles; que no hay scroll en layout ancho (o que el contenedor no fuerza scroll innecesario).
- Prior art: los tests existentes de Pinia con `vi.mock`, los tests de helpers puros con instantes determinísticos, y los tests de componentes con Vue Test Utils colocados junto al módulo que ejercen, con limpieza de localStorage entre tests vía setup global.
- Verificación: suite unitaria completa y build de producción en verde. Como se toca un widget del Dashboard, el presupuesto de rendimiento del Dashboard debe permanecer verde.

## Out of Scope

- Cambios en la lógica de dominio del temporizador (duraciones, intervalos de descanso largo, auto-start, volumen/mute, máquina de fases, conteo de sesiones completadas).
- Cambios en persistencia, schemas, sonidos, o capa Rust/Tauri/SQLite.
- Nuevos tokens de diseño, paletas por fase más allá de primario/éxito, o dependencias de UI.
- Vinculación de sesiones a hábitos, tareas u objetivos; historial o estadísticas de Pomodoro; presets con nombre; sonido de tick; notificaciones del sistema.
- Hacer que el círculo de la Vista Pomodoro también alterne con click (se mantiene solo en el widget); cambios en la Sidebar o en otros widgets.
- Deep-linking, múltiples timers simultáneos, o sonidos por fase al iniciar.

## Further Notes

- Vocabulario del glosario aplicable: Widget, Dashboard, Vista Pomodoro, Fase (enfoque / descanso corto / descanso largo), Ciclo, Sesión de enfoque. "Pomodoro" nombra la vista y la técnica, no la unidad de trabajo.
- Decisiones de esta sesión (grilling): Q1 nada del widget navega; Q2 el anillo cambia de color por fase; Q3 icono play/pause siempre visible; Q4 sin título en la vista; Q5 controles de la vista sin cambios; Q6 responsive con scroll solo en angosto; Q7 mismo panel de configuración; Q8 enfoque=primary/descansos=success; Q9 icono siempre visible; Q10 header del widget se mantiene.
- La elección de `success` para descansos evita introducir tokens nuevos y funciona en los tres temas existentes.
