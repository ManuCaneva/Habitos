# AEON

Productivity dashboard local-first para escritorio. El usuario organiza su tiempo y actividad en torno a hábitos, objetivos, tareas y un cronograma semanal, todo desde un dashboard configurable de widgets.

## Language

**Hábito**:
Una acción recurrente que el usuario se compromete a realizar con una frecuencia determinada. Un hábito diario puede tener un target de repeticiones por día (ej. "Tomar 8 vasos de agua"); los semanales y por intervalo son binarios. Se registra con check-ins diarios y acumula rachas.
_Avoid_: rutina, costumbre, meta

**Racha**:
Cantidad de días consecutivos en los que un hábito registró al menos un check-in según su frecuencia. Se interrumpe al fallar un período.
_Avoid_: streak, seguidilla

**Check-in**:
El registro de cumplimiento de un hábito en un día concreto. En un hábito progresivo, cada check-in acumula una repetición de progreso, de 1 hasta el target. Un día con al menos un check-in cuenta como cumplido para la racha.
_Avoid_: marca, tildado, registro

**Frecuencia**:
La cadencia con la que se espera cumplir un hábito u objetivo: diaria, semanal, o cada N días (intervalo).
_Avoid_: periodicidad, repetición

**Objetivo**:
Una meta cuantificable que mide una cantidad continua arbitraria (páginas, minutos) con un target numérico y progreso acumulado por período. A diferencia de un hábito — que acumula repeticiones discretas por día — no tiene un límite superior de anotación por período.
_Avoid_: meta, target, goal

**Tarea**:
Un ítem de trabajo con estados (todo / doing / done), pasos internos, color y vencimiento opcional. Puede archivarse al dejar de ser relevante.
_Avoid_: item, to-do, pendiente

**Pasos**:
Sub-tareas internas de una tarea, cada una con su propio estado de completado.
_Avoid_: sub-tarea, checklist

**Widget**:
Un bloque configurable del dashboard (hábitos, tareas, objetivos, calendario anual, cronograma semanal). El usuario puede moverlos, redimensionarlos, ocultarlos o restaurarlos.
_Avoid_: contenedor, módulo, tarjeta

**Cronograma semanal**:
Una grilla de días por franjas horarias donde el usuario organiza actividades recurrentes de la semana.
_Avoid_: horario, agenda, plan semanal

**Bloque**:
Una actividad coloreada del cronograma semanal (una materia, el gimnasio, el trabajo).
_Avoid_: actividad, evento, slot

**Slot**:
Una ocurrencia concreta de un bloque en la grilla: un día de la semana con hora de inicio y fin. Un bloque puede tener varios slots.
_Avoid_: franja, espacio

**Ventana visible**:
El rango horario que la grilla del cronograma muestra de cada día. Se ajusta sola: abraza desde el slot más temprano hasta el más tardío (redondeado a horas enteras), o muestra un horario por defecto cuando no hay slots. No se configura manualmente.
_Avoid_: rango de la grilla, desde/hasta, horario de la grilla

**Archivado**:
Ocultar un hábito, tarea u objetivo de las vistas activas sin perder su historial. Puede restaurarse. Los hábitos archivados dejan de sumar racha pero conservan sus logs.
_Avoid_: eliminar, borrar, descartar

**Log**:
El registro puntual de progreso asociado a un hábito o un objetivo en una fecha: un check-in para hábitos, una cantidad para objetivos.
_Avoid_: entrada, registro, entrada de progreso

**Dashboard**:
La vista principal de la app: una grilla de widgets que el usuario configura.
_Avoid_: panel, home, inicio
