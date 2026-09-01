# 04: Vista Pomodoro y navegación

**What to build:** la pantalla del temporizador, accesible desde el Sidebar como una vista de primera clase. Muestra una cuenta regresiva grande con anillo de progreso, la fase actual y la cantidad de ciclos completados, con controles para iniciar, pausar, saltar y reiniciar. Al completarse una fase suena la campana correspondiente. Navegar entre vistas no interrumpe la sesión.

**Blocked by:** 03 (Store del temporizador), 02 (Sonidos sintetizados)

**Status:** done

- [x] Existe una nueva vista Pomodoro que se renderiza cuando se selecciona su modo de navegación.
- [x] La vista muestra la cuenta regresiva en `mm:ss` con anillo de progreso.
- [x] La vista muestra la fase actual (enfoque / descanso corto / descanso largo) y los ciclos completados.
- [x] Los controles de iniciar, pausar, saltar y reiniciar están disponibles según la fase.
- [x] Al terminar una fase de enfoque suena la campana de fin de enfoque; al terminar un descanso suena la de fin de descanso.
- [x] El Sidebar tiene una entrada "Pomodoro" que navega a esta vista.
- [x] El temporizador sigue corriendo al navegar a otra vista.
- [x] Tests de componentes cubren el render de countdown, fase, dots de ciclo y la disponibilidad de controles por estado.
