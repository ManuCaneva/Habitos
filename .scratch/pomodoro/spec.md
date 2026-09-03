# Vista Pomodoro con temporizador de sesiones de enfoque

Status: ready-for-agent
Label: ready-for-agent

## Problem Statement

AEON es una aplicación de productividad local-first centrada en hábitos, objetivos, tareas y un cronograma semanal, pero hoy no tiene forma de sostener una sesión de concentración cronometrada. La persona usuaria que estudia o necesita bloques de trabajo ininterrumpido tiene que recurrir a un temporizador externo, lo que la saca de la aplicación y desconecta la herramienta de su flujo de productividad.

Necesita un temporizador Pomodoro integrado —como el descrito en `docs/IDEAS.md`, sección "3. Pomodoro / Timer"— que le permita iniciar sesiones de enfoque, alternar con descansos, automatizar la transición entre fases, recibir aviso sonoro al terminar cada fase, y continuar la sesión aunque cierre o reabra la aplicación.

## Solution

Agregar una **Vista Pomodoro** accesible desde el Sidebar (junto a Dashboard y Archivados) y un **widget de temporizador** para el dashboard. La vista muestra una cuenta regresiva grande con anillo de progreso, el estado de la fase actual (enfoque / descanso corto / descanso largo), la cantidad de ciclos completados, y controles para iniciar, pausar, saltar fase y reiniciar.

El temporizador corre por marcas de tiempo (`ends_at`), no por ticks, de modo que es preciso y sobrevive al cierre de la aplicación. Las duraciones, los toggles de automatización y el volumen de los sonidos son configurables desde un panel dentro de la propia vista. Al terminar una fase, suena una campana sintetizada (sin archivos de audio ni dependencias nuevas). En esta primera versión la sesión es completamente libre: no se vincula a tareas ni objetivos y no se guarda historial.

## User Stories

1. As a person who wants to focus, I want to open a Pomodoro view from the sidebar, so that I can access the timer as a first-class part of the app.
2. As a person opening the Pomodoro view, I want to see a large countdown in `mm:ss` format, so that I can read the remaining time at a glance.
3. As a person using the timer, I want to see a progress ring around the countdown, so that I can sense progress without reading the number.
4. As a person using the timer, I want to see which phase I am in (focus, short break, or long break), so that I always know what the countdown represents.
5. As a person using the timer, I want to see how many focus sessions I have completed in the current cycle, so that I know how close I am to a long break.
6. As a person about to focus, I want to press a start control, so that I begin the focus session.
7. As a person in an active session, I want to press pause, so that I can interrupt and later resume without losing the session.
8. As a person who wants to skip a phase, I want a skip control, so that I can move to the next phase immediately.
9. As a person who wants to start over, I want a reset control, so that I can discard the current cycle and begin again.
10. As a person who completed a focus session, I want the timer to advance to a short break automatically when auto-start breaks is enabled, so that the rhythm continues without me touching anything.
11. As a person who prefers manual control, I want to disable auto-start of breaks, so that I decide when the break begins.
12. As a person who wants a hands-free study mode, I want the option to auto-start the next focus session after a break, so that I can run full cycles without interaction.
13. As a person who completed a full set of focus sessions, I want a long break instead of a short break, so that I get a longer recovery periodically.
14. As a person configuring the timer, I want to set the long break interval (e.g. every 4 focus sessions), so that the long break cadence matches my preference.
15. As a person configuring the timer, I want to edit the focus duration, so that I can use techniques like 50/10 for studying.
16. As a person configuring the timer, I want to edit the short break duration, so that I can tune my recovery time.
17. As a person configuring the timer, I want to edit the long break duration, so that I can tune my longer recovery time.
18. As a person finishing a focus session, I want to hear a distinct sound, so that I know to stop working without looking at the screen.
19. As a person finishing a break, I want to hear a distinct sound, so that I know it is time to focus again.
20. As a person who needs silence, I want to mute the sounds, so that the timer does not disturb me or others.
21. As a person adjusting the alert, I want to control the volume of the sounds, so that they are audible without being jarring.
22. As a person who closes the app mid-session, I want the timer to keep its end time, so that I do not lose the session.
23. As a person who reopens the app with an active session, I want the countdown to resume from the correct remaining time, so that the session continues seamlessly.
24. As a person who reopens the app after the session already expired, I want the app to detect the expiry, play the sound, and advance to the next phase automatically, so that the app never gets stuck on a dead countdown.
25. As a person who skipped a focus session before it finished, I want that session not to count toward the long break cycle, so that only naturally completed sessions advance the cycle.
26. As a person viewing the dashboard, I want a compact timer widget showing the phase, the `mm:ss` countdown, and a start/pause control, so that I can manage focus without leaving the dashboard.
27. As a person viewing the timer widget, I want a progress ring, so that I can see progress in the widget too.
28. As a person viewing the timer widget, I want clicking the widget body to open the full Pomodoro view, so that I can access detailed controls.
29. As a person switching between views, I want the timer to keep running in the background, so that navigating does not interrupt my session.
30. As a maintainer, I want the feature to reuse the existing navigation, config persistence, and design tokens, so that it fits the established architecture without new infrastructure.
31. As a person configuring the timer, I want my settings to persist across restarts, so that I do not reconfigure every time.
32. As a person configuring the timer, I want the settings to have sensible defaults (25/5/15, long break every 4, auto-start break on, auto-start focus off), so that the classic Pomodoro works out of the box.

## Implementation Decisions

- The feature is frontend-only. No Rust, Tauri command, SQLite schema, or migration changes are required: settings and the active session state are stored in the existing key-value config persistence, consistent with how the weekly schedule settings are stored.
- A new Pinia setup store owns all timer domain logic. It is the single seam that knows the phase machine, the timing, and persistence. Components read state and call actions; they never own timing logic.
- The timer is timestamp-based. Starting a phase records an end instant derived from the current phase duration; the displayed remaining time is always computed as the difference between the end instant and "now". Pausing stores the remaining milliseconds and clears the end instant; resuming re-derives a new end instant from the remaining time.
- The phase machine states are: idle, focus, short break, and long break. Focus is the default starting phase. The phase sequence is focus → short break → focus → … with a long break substituting the short break after the configured number of completed focus sessions.
- Only a focus session that reaches its end naturally counts toward the long break interval. Skipping a focus session mid-way does not increment the completed-focus count.
- On app boot, the store loads any persisted active session. If its end instant has already passed, the store plays the appropriate sound and advances to the next phase, honoring the auto-start toggles.
- The timer state is held in the store as a module-scoped Pinia singleton, so it survives navigation between views. Only persistence makes it survive an app restart.
- Settings are a validated object: focus duration, short break duration, long break duration, long break interval, auto-start break toggle, auto-start focus toggle, volume, and mute. Defaults are focus 25, short break 5, long break 15, long break every 4, auto-start break on, auto-start focus off.
- The active session state is a separate validated object persisted only while a session exists, containing the phase, whether it is running, the end instant when running, the remaining milliseconds when paused, and the completed-focus count.
- Sounds are synthesized with the Web Audio API at phase completion. There are two distinct chimes: one for the end of focus and one for the end of a break. Volume and mute come from the settings. No audio files, no audio assets, and no new dependencies are introduced.
- The audio context is created or resumed on a user gesture to satisfy the platform autoplay policy.
- The Pomodoro view is added as a top-level navigation mode and as a Sidebar entry alongside Dashboard and Archived. The dashboard registers a new Pomodoro timer widget following the existing widget registration pattern.
- The timer widget shows the current phase, the countdown, a progress ring, and a start/pause control. Clicking the widget body navigates to the Pomodoro view.
- Pure time and phase computations (phase duration lookup, remaining time from an end instant, next-phase determination, clock formatting, and progress fraction) are extracted into a small pure helper module with no dependencies on Pinia or persistence, so they are unit-testable in isolation.
- No history, statistics, presets, or linking to tasks/habits/objectives is included in this version.

## Testing Decisions

- The primary seam is the Pinia store: tests drive `start`, `pause`, `resume`, `skip`, `reset`, and phase advancement, and observe the resulting state and persisted config. The data-access layer is mocked so tests never touch the real Tauri backend, following the established `vi.mock` convention.
- Pure time and phase helpers are tested directly against deterministic instants, covering duration lookup, remaining-time computation, next-phase ordering including the long-break substitution, formatting, and progress fractions at the boundaries (full, empty, mid).
- Tests assert external behavior, not implementation details: for components, they assert rendered text, ring progress, emitted events, and control availability rather than internal class names or computed-property names.
- Store tests cover: starting a focus session, pausing and resuming without losing time, skipping a phase, resetting the cycle, completing a focus session so it increments the completed-focus count, skipping a focus session so it does not increment, substituting a long break at the configured interval, and honoring both auto-start toggles.
- Store tests cover persistence: that settings and active state round-trip through the mocked config layer, and that on boot an already-expired session advances correctly and a still-running session resumes with the right remaining time.
- Sound tests mock the audio context and assert that the correct chime is triggered for each phase transition, that mute suppresses it, and that volume is applied.
- Component tests for the timer cover rendering of the countdown, phase label, completed-focus dots, and the availability of start, pause, skip, and reset controls in each phase state.
- Component tests for the widget cover the compact countdown, phase display, start/pause control, and that clicking the body navigates to the Pomodoro view.
- Component tests for the settings panel cover editing each duration, the long break interval, both toggles, and the volume and mute controls, emitting the expected changes.
- Prior art: the existing Pinia store tests, the pure-helper tests in the lib layer, and the widget/component tests using Vue Test Utils, all colocated next to the module they exercise.
- Verification includes the full unit test suite and the production build. Because a new dashboard widget is added, the dashboard performance budget must remain green.

## Out of Scope

- Linking sessions to tasks, habits, or objectives.
- Recording any history, statistics, or per-day counts of completed sessions.
- Named presets (e.g. "Estudio 50/10", "Trabajo 25/5") beyond a single editable configuration.
- A ticking sound or metronome during the session.
- System notifications; the feature relies on in-app sound and window state.
- Any Rust, Tauri command, SQLite table, or migration work.
- Changing the existing navigation architecture, the widget grid, or the dashboard layout system beyond registering one new widget.
- Deep-linking, multiple simultaneous timers, or per-phase start sounds.

## Further Notes

- The domain glossary gains new terms for this feature: a **Sesión de enfoque** (focus block), a **Descanso** (short or long break), a **Ciclo** (a focus session plus its break), a **Fase** (the current timer state: focus, short break, or long break), and the **Vista Pomodoro** (the screen itself). "Pomodoro" remains the name of the view and the technique, not the unit of work.
- This feature only adds the tool; it deliberately does not yet integrate with the rest of the domain (tasks, habits, objectives). That integration is a candidate for a future version.
- The timestamp-based engine is what makes survival across restarts and accurate countdowns possible with no new infrastructure, and is the reason no database migration is required.
