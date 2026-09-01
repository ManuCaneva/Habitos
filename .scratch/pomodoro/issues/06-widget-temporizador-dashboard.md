# 06: Widget de temporizador en el dashboard

**What to build:** un widget compacto del dashboard que muestra la fase actual, la cuenta regresiva `mm:ss`, un anillo de progreso y un control de iniciar/pausar. Al hacer clic en el cuerpo del widget se abre la Vista Pomodoro. Al sumar un widget a la grilla, se actualizan los asserts de cantidad de widgets y se verifica el presupuesto de rendimiento del dashboard.

**Blocked by:** 04 (Vista Pomodoro y navegación)

**Status:** done

- [x] El widget se registra en la grilla con dimensiones válidas dentro del máximo del tablero.
- [x] El widget muestra la fase, el countdown `mm:ss` y un anillo de progreso.
- [x] El widget tiene un control de iniciar/pausar que actúa sobre el store.
- [x] Hacer clic en el cuerpo del widget navega a la Vista Pomodoro.
- [x] Los tests existentes de registro de widgets y layout reflejan el nuevo widget.
- [x] El presupuesto de rendimiento del dashboard (`test:perf`) sigue verde.
- [x] Tests del widget cubren el countdown compacto, la fase, el control y la navegación al hacer clic.
