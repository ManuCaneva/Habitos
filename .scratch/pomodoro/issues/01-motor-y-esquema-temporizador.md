# 01: Motor y esquema del temporizador

**What to build:** la lógica pura que decide cómo se comporta el temporizador: qué duración corresponde a cada fase, cuánto tiempo queda a partir de una marca de fin, cuál es la fase siguiente (sustituyendo el descanso largo en el intervalo correcto), cómo se muestra el tiempo y qué fracción de progreso lleva la fase actual. También los esquemas de validación de la configuración y del estado activo de sesión. Nada de esto depende de Pinia ni de persistencia; es la base sobre la que se construye todo lo demás.

**Blocked by:** None (can start immediately)

**Status:** done

## Progress

- [x] Definir y probar el motor puro del temporizador.
- [x] Definir y probar los esquemas Zod de configuración y sesión activa.
- [x] Ejecutar la suite completa y el build.
- [x] Revisar los cambios y marcar el ticket como `done`.

## Comments

- Implementados `src/lib/pomodoro.ts` y `src/schemas/pomodoro.ts` con tests unitarios colocados junto a cada módulo.
- Verificado: tests puntuales, `npm run test`, `npm run build` y `npm run lint`.
- La revisión detectó y corrigió la validación de invariantes entre sesión corriendo y pausada.

- [x] La máquina de fases distingue `idle`, `focus`, `shortBreak` y `longBreak`.
- [x] El lookup de duración devuelve los minutos correctos para cada fase según la configuración.
- [x] Dada una marca de fin y un instante "ahora", se calcula el tiempo restante en milisegundos (sin negativos).
- [x] La fase siguiente respeta la secuencia focus → descanso corto → focus, sustituyendo por descanso largo tras la cantidad configurada de sesiones completadas.
- [x] El formateo produce `mm:ss` correcto en límites (cero, valores medios, redondeo).
- [x] La fracción de progreso es 0 al inicio, 1 al completar, y un valor intermedio correcto a mitad de fase.
- [x] Los esquemas Zod validan settings y estado activo, con defaults (25/5/15, descanso largo cada 4, auto-start break on, auto-start focus off, volumen, mute).
- [x] Tests unitarios de todas las funciones puras cubren casos borde (límites, descanso largo en el intervalo exacto, skip sin contar).
