# 02: Sonidos sintetizados

**What to build:** las dos campanas que avisan el fin de cada fase, generadas con Web Audio API (sin archivos ni dependencias nuevas). Al terminar una sesión de enfoque suena una campana distinta de la del fin de descanso. Respetan el volumen y el mute de la configuración, y el contexto de audio se crea o resume en el primer gesto del usuario para no chocar con la política de autoplay.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Existe una función para reproducir el sonido de fin de enfoque y otra para el de fin de descanso.
- [x] Los sonidos se sintetizan con Web Audio API, sin archivos de audio ni dependencias nuevas.
- [x] El volumen configurado se aplica a la reproducción.
- [x] Con mute activado no se reproduce sonido.
- [x] El contexto de audio se crea o resume en un gesto del usuario.
- [x] Tests con `AudioContext` mockeado verifican que se dispara el chime correcto por fase y que mute y volumen se respetan.

**2026-09-01 — Implementación.** Se agregó `createPomodoroSoundPlayer` en `src/lib/pomodoroSounds.ts`, con campanas de enfoque y descanso sintetizadas mediante dos osciladores y una envolvente de ganancia. `prepareFromUserGesture()` crea o resume el contexto desde el gesto del usuario; la reproducción respeta `volume` y `muted`. Tests unitarios cubren ambas melodías, volumen, mute, volumen cero, scheduling y el bloqueo previo a la preparación. La integración con la transición de fases queda a cargo del ticket 03 (store del temporizador).
