# 03: Store del temporizador

**What to build:** el store que dueña toda la lógica de dominio del temporizador y su persistencia. Permite iniciar, pausar, reanudar, saltar y reiniciar la sesión; avanza la fase al llegar al fin (corriendo por marcas de tiempo, no por ticks); cuenta solo las sesiones de enfoque completadas naturalmente; respeta los toggles de auto-start; resuelve al arrancar una sesión que venció mientras la app estaba cerrada; y persiste la configuración y el estado activo en el almacén de configuración existente.

**Blocked by:** 01 (Motor y esquema del temporizador)

**Status:** done

- [x] Iniciar una fase registra una marca de fin derivada de la duración de la fase.
- [x] Pausar guarda el tiempo restante y limpia la marca de fin; reanudar deriva una nueva marca a partir del restante.
- [x] Saltar una fase avanza a la siguiente sin contar la sesión como completada.
- [x] Reiniciar descarta el ciclo y vuelve al estado inicial.
- [x] Completar una sesión de enfoque incrementa el conteo de completadas; saltarla no.
- [x] Al alcanzar el intervalo configurado, la fase siguiente es un descanso largo.
- [x] Los toggles de auto-start deciden si la siguiente fase arranca sola o queda pausada.
- [x] Al iniciar la app, una sesión activa vigente retoma con el tiempo restante correcto.
- [x] Al iniciar la app, una sesión ya vencida avanza a la siguiente fase respetando los toggles.
- [x] La configuración y el estado activo persisten y se cargan desde el almacén de configuración (mocked en tests).
- [x] Tests del store con la capa de datos mockeada cubren los flujos de start/pause/resume/skip/reset y la persistencia round-trip.

## Trazabilidad

- Tests primero: `src/stores/pomodoro.test.ts` cubre los criterios del ticket con `src/lib/db` mockeado.
- Implementación: `src/stores/pomodoro.ts` concentra la máquina de fases, timestamps, persistencia y auto-start.
- Verificación aislada: `npm test -- --run src/stores/pomodoro.test.ts` (4 tests verdes).
