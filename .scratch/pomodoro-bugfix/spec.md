# Corrección del widget y arranque del Pomodoro

Status: done
Label: done

## Problem Statement

El widget de Pomodoro no se integra visualmente con el resto de los widgets del dashboard: no tiene la franja superior con el título "Pomodoro", no aplica el formato responsive común y el anillo de progreso no se distingue del fondo.

Además, al presionar "Iniciar" en la Vista Pomodoro, la aplicación muestra errores nativos de WebKitGTK/GLib relacionados con la inicialización del audio:

```text
GLib-GObject-CRITICAL: invalid (NULL) pointer instance
GLib-GObject-CRITICAL: g_signal_connect_data: assertion 'G_TYPE_CHECK_INSTANCE (instance)' failed
```

El temporizador no comienza porque la vista espera que la preparación del audio termine antes de ejecutar el arranque de la sesión. En entornos Linux con WebKitGTK, la inicialización de `AudioContext` puede fallar o no completarse debido al backend de audio, bloqueando una funcionalidad esencial por una dependencia opcional.

Al redimensionar el widget de Pomodoro en modo edición, su contenido desaparece en lugar de mostrar una vista previa continua del nuevo tamaño. El mecanismo genérico de resize del dashboard y el contrato de `deltaRect` de interactjs ya fueron verificados; el problema debe aislarse en el layout y el contenido específico del widget.

## Solution

Hacer que el widget de Pomodoro respete el lenguaje visual común del dashboard, que el anillo de progreso use colores válidos y visibles, y que el arranque del temporizador no dependa de que el backend de audio de WebKitGTK esté disponible.

El audio continuará siendo una mejora best-effort: cuando pueda prepararse, se utilizará para las campanas de cambio de fase; cuando no pueda prepararse, la sesión igualmente comenzará y continuará funcionando.

El widget deberá conservar una representación visible y estable durante todo el gesto de redimensionado, con el mismo comportamiento de preview que los demás widgets.

## User Stories

1. As a person viewing the dashboard, I want the Pomodoro widget to have the same header strip as the other widgets, so that I can identify it consistently.
2. As a person viewing the Pomodoro widget, I want to see the title "Pomodoro" in the header, so that the widget's purpose is immediately clear.
3. As a person viewing the dashboard, I want the Pomodoro widget to use the shared widget container conventions, so that its spacing and typography adapt consistently to its size.
4. As a person viewing the Pomodoro widget, I want the progress ring to be visible against the widget background, so that I can understand the current progress at a glance.
5. As a person using a configured theme, I want the progress ring to use that theme's primary and surface colors correctly, so that it remains visible in every supported theme.
6. As a person resizing the Pomodoro widget in edit mode, I want to see its bounds and content update continuously, so that I know the resulting size before releasing the pointer.
7. As a person resizing the Pomodoro widget, I want its content to remain visible throughout the gesture, so that resizing does not appear to remove the widget.
8. As a person starting a Pomodoro session on Linux, I want the timer to start even if the audio backend cannot be initialized, so that an audio problem does not prevent me from focusing.
9. As a person starting a Pomodoro session on a platform with working Web Audio, I want audio preparation to happen from my start gesture, so that phase-completion sounds remain permitted by autoplay policy.
10. As a person using the Pomodoro timer, I want an unavailable or failing audio context to degrade silently or safely, so that the application does not produce an unhandled rejection.
11. As a person starting a paused Pomodoro session, I want the session state and end timestamp to be persisted as usual, so that making audio best-effort does not change timer persistence.
12. As a person using the dashboard widget, I want its start control to have the same audio-failure behavior as the full Pomodoro view, so that starting from either surface is reliable.
13. As a person using the Pomodoro view, I want the countdown and progress state to continue updating after start regardless of audio availability, so that the essential timer behavior is independent of sound.
14. As a maintainer, I want regression coverage at the existing sound-player and component seams, so that future WebKitGTK or styling changes do not reintroduce these failures.

## Implementation Decisions

- The change is frontend-only. No Rust command, SQLite schema, migration, or persistence contract changes are required.
- The existing Pomodoro sound-player seam remains responsible for Web Audio preparation and synthesized chimes. Audio context creation and resumption become defensive and best-effort rather than allowing platform failures to propagate into timer control flow.
- The start interaction in both the full Pomodoro view and the dashboard widget must not wait for audio preparation before starting the store session. Audio preparation is initiated from the user gesture, but failure to prepare audio must not prevent the timer start action.
- The existing Pinia Pomodoro store remains the domain seam for session state, timestamps, persistence, and phase advancement. The timer engine itself must not be coupled to successful audio initialization.
- The progress ring in both the full view and the widget must construct valid CSS colors from the project's space-separated RGB custom properties. The implementation must preserve theme tokens rather than introduce hardcoded colors.
- The Pomodoro widget must add a header strip matching the established dashboard convention: surface-2 background, bottom hairline border, and centered card-title typography with the text "Pomodoro".
- The widget root must use the shared `container-widget` and inline-size container conventions so existing responsive dashboard rules apply to its typography and spacing.
- The widget must maintain a visible, bounded layout while the generic grid item temporarily uses absolute pixel dimensions during resize. The resize behavior must be fixed at the Pomodoro widget/layout seam, without changing the verified generic interactjs `deltaRect` contract unless reproduction proves that contract insufficient.
- The minimum registered widget dimensions remain the existing valid Pomodoro dimensions. No dashboard grid, collision, or snapping behavior changes are part of this work.
- Existing click behavior remains: clicking the widget body opens the full Pomodoro view, while the start/pause control continues to stop propagation and control the session directly.

## Testing Decisions

- Tests must assert observable behavior rather than private refs, computed-property names, or implementation details.
- The sound-player tests will cover the failure paths where audio context construction throws or context resumption rejects. They must assert that preparation resolves safely and does not make subsequent timer control fail.
- The full Pomodoro view component tests will cover that its start control invokes the store start action even when audio preparation rejects. They will continue to cover phase, countdown, ring progress, and control availability.
- The dashboard widget component tests will cover the same audio-failure behavior, the visible "Pomodoro" header, the shared widget structure, the progress ring style, and the existing navigation/start/pause behavior.
- The progress ring test should verify the externally rendered style uses valid theme-token color expressions for both the primary progress and surface track, not hardcoded color values.
- The resize regression test should exercise the highest available component/dashboard seam and verify that the Pomodoro widget remains rendered and tracks the temporary dimensions during a resize gesture. If the current test harness cannot reproduce the issue, the implementation must document that gap and add the smallest appropriate seam rather than asserting only static markup.
- Existing dashboard and grid tests remain the regression suite for generic movement, resize snapping, collision handling, and FLIP behavior. They should not be weakened or changed to hide a Pomodoro-specific failure.
- External Tauri, WebKitGTK, and audio dependencies remain mocked in unit tests. No unit test may initialize the real Tauri runtime, SQLite database, or system audio device.
- Verification after implementation must include the full unit test suite and production build. Since the dashboard widget is affected, the dashboard performance budget must also be checked.

## Out of Scope

- Replacing Web Audio with audio files, a new audio dependency, native notifications, or a Rust audio implementation.
- Fixing WebKitGTK, GStreamer, PulseAudio, PipeWire, or the host operating system itself.
- Adding Pomodoro history, statistics, presets, task links, habit links, or objective links.
- Changing the timestamp-based session model, phase sequence, auto-start semantics, or persistence keys.
- Changing the generic dashboard grid model, collision rules, snap algorithm, or interactjs integration without a reproduced regression demonstrating that the generic layer is responsible.
- Redesigning the full Pomodoro view beyond the ring color correction and any shared styling needed to keep its visual language aligned with the widget.
- Changing unrelated uncommitted database migrations or scratch issues in the worktree.

## Further Notes

- The theme system intentionally stores colors as space-separated RGB triplets because Tailwind wraps them with `rgb(var(--color-token) / <alpha-value>)`. Manual gradient declarations must apply the equivalent `rgb(...)` wrapper.
- The original Pomodoro feature spec is stored separately under `.scratch/pomodoro/spec.md`; this spec is a bug-fix follow-up for that feature.
- The resize report is specific to Pomodoro according to the user. The generic grid resize wiring was inspected and interactjs `deltaRect` is part of the installed public API, so the implementation should begin with a focused reproduction of the Pomodoro widget rather than modifying shared resize code speculatively.
