# IDEAS.md

> **Uso de este archivo**: Este archivo es un mapa conceptual compartido entre el developer y la AI. No es documentación técnica ni specs formales. Se consulta **explícitamente** cuando se quiere profundizar en una feature, explorar alternativas o tomar decisiones de diseño. Está pensado para ser editado y refactoreado a medida que el proyecto evoluciona.

---

## Visión general

Transformar la app de hábitos en una **aplicación centralizada de productividad** que permita gestionar tiempo, tareas, proyectos y conocimiento personal de forma unificada y personalizable.

---

## 0. Widgets del Dashboard (PRIORIDAD MÁXIMA)

> **Concepto**: El dashboard será una grilla de **contenedores/widgets** independientes. Cada widget vive dentro de su propio contenedor y el usuario puede organizarlos, moverlos o esconderlos. Todo lo que sigue en esta sección son widgets que residen en el dashboard.

### Widget: Tareas pendientes
- Lista de tareas dentro de un contenedor en el dashboard
- Cada tarea puede tener:
  - **Pasos / sub-tareas**: checklist anidada dentro de la tarea
  - **Color asignable**: el usuario elige un color para categorizar o priorizar visualmente
  - **Descripción**: campo de texto con detalles de la tarea
  - **Fecha de finalización**: deadline
  - **Contador de falta**: mostrar visualmente cuánto falta para la fecha de vencimiento (ej: "Faltan 3 días", barra de progreso, indicador de urgencia)
- Todo dentro de un contenedor widget en el dashboard

### Widget: Objetivos
- Seguimiento de objetivos del estilo: "Estudiar 30 min por día" o "Leer 10 páginas por día" (estos son solo ejemplos; la idea son plantearse objetivos según las necesidades del usuario)
- **Diferencia con hábitos**: los objetivos se cumplen cuando pasan **cosas específicas** (ej: leí 10 páginas, estudié un tema), no son simplemente un check diario binario
- Cada objetivo puede tener:
  - Descripción de qué se necesita cumplir
  - Métrica de progreso (ej: 7/10 páginas hoy)
  - Frecuencia (diario, semanal, etc.).
  - Indicador visual de cumplimiento
- Todo dentro de un contenedor widget en el dashboard

### Widget: Calendario anual
- Vista de calendario anual completo (los 12 meses en grid)
- **Conexión con Google Calendar**: sincronización para traer eventos externos
- Marcadores visuales para días con tareas, objetivos o eventos
- Navegación entre años
- Todo dentro de un contenedor widget en el dashboard

### Widget: Cronograma semanal
- Grilla de **días vs franjas horarias** (ejes: días de la semana cruzados con horarios)
- Permite colocar **bloques de actividades** en slots específicos:
  - Materias / cursos
  - Gimnasio
  - Trabajo
  - Cualquier actividad recurrente
- Drag & drop para mover bloques
- Bloques coloreables por categoría
- Vista semanal con scroll vertical en el eje de tiempo
- Todo dentro de un contenedor widget en el dashboard

---

## 1. Core de gestión del tiempo

### Calendario integrado
- Vista diaria / semanal / mensual
- Drag & drop de eventos
- Sincronización con Google Calendar / iCal (futuro)

### Pomodoro / Timer
- Temporizadores vinculados a tareas o hábitos
- Tracking de tiempo enfocado
- Historial de sesiones

### Planificador diario
- Vista tipo "daily planner"
- Combinar hábitos + tareas + eventos del día en una sola vista
- Drag & drop para reordenar prioridades

---

## 2. Gestión de tareas

### Tareas con sub-tareas
- Jerarquía infinita
- Checklists anidadas

### Etiquetas y prioridades
- Sistema de tags flexible
- Prioridad (P1-P4)
- Estados (todo / doing / done)

### Vista Kanban
- Tableros tipo Trello
- Columnas por estado o por proyecto

### Recurring tasks
- Tareas que se repiten con deadline (diferente a hábitos: tienen fecha de vencimiento)

### Quick capture
- Captura rápida tipo inbox
- Palette de comandos (Ctrl+K)

---

## 3. Proyectos

### Proyectos con deadlines
- Agrupar tareas + hábitos bajo un proyecto
- Fecha de inicio y fin estimada

### Milestones
- Hitos dentro de proyectos
- Checkpoints de progreso

### Progreso visual
- Barras de progreso
- Tiempo estimado vs real

### Templates
- Plantillas de proyectos recurrentes
- Duplicar estructura de proyecto existente

---

## 4. Notas / Knowledge

### Notas rápidas
- Tipo Apple Notes
- Vinculables a tareas, proyectos o hábitos

### Journaling diario
- Diario personal con prompts
- Mood tracking integrado

### Hábitos como datos
- Exportar datos de hábitos
- Gráficos de streaks y tendencias
- Estadísticas personales a lo largo del tiempo

---

## 5. Gamificación y motivación

### Sistema de puntos / XP
- Recompensas por completar tareas y hábitos

### Streaks globales
- Racha general de productividad (no solo por hábito)

### Logros / achievements
- Badges por hitos alcanzados

### Estadísticas
- Dashboard con métricas: tiempo enfocado, tareas completadas, hábitos activos

---

## 6. Personalización (futuro)

### Plugins / extensiones
- Sistema de módulos activables / desactivables
- El usuario elige qué features tiene visibles

### Themes
- Temas personalizables
- Modo claro / oscuro / custom

### Views custom
- El usuario crea sus propias vistas (tipo Notion databases)
- Filtros avanzados por fecha, tag, proyecto, estado

### Shortcuts personalizables
- Atajos de teclado configurables

---

## 7. Pomodoro (post v1)

Sesiones de estudio/productividad con temporizador pomodoro configurable.

- Configuración de duración de sesiones (trabajo / descanso / descanso largo)
- Pomodoros vinculados a hábitos o tareas
- Conteo de pomodoros completados por día
- Historial de sesiones
- Possibilidad de configurar presets (ej: estudio 50/10, trabajo 25/5)

---

## 8. Integraciones

### Sync entre dispositivos
- Cloud sync opcional con encriptación

### Webhooks / API
- Conectar con otros servicios

### Import / Export
- CSV, JSON
- Integración con otros tools de productividad

---

## Roadmap sugerido (orden de prioridad)

| Fase | Features | Por qué primero |
|------|----------|------------------|
| 0 | **Widgets del Dashboard** (Tareas pendientes, Objetivos, Calendario anual, Cronograma semanal) | Es la base de la app centralizada. Todo vive como widgets en el dashboard. |
| 1 | **Tareas** (prioridades, estados, sub-tareas) | Llena el gap más grande junto a hábitos |
| 2 | **Calendario** | Ya tenemos fechas, se integra naturalmente |
| 3 | **Proyectos** | Agrupa tareas + hábitos bajo un contexto |
| 4 | **Quick capture / Inbox** | Captura rápida reduce fricción |
| 5 | **Gamificación** | Engagement y motivación |
| 6 | **Notas / Journaling** | Complementa el tracking con reflexión |
| 7 | **Pomodoro** | Productividad enfocada post-v1 |
| 8 | **Personalización extrema** | Cuando la base esté sólida |

---

## Notas abiertas

- *Agregar aquí decisiones de diseño, dudas pendientes, o ideas que surjan durante el desarrollo.*

### Multi-check-in progresivo (hábitos con múltiples repeticiones por día)

Un hábito puede requerir N repeticiones por día (ej: "Tomar 8 vasos de agua", "Hacer 3 series de ejercicio"). Cada tap en el botón de check-in incrementa un contador visual. El color del botón se llena progresivamente (opacity/shade) hasta alcanzar el color completo cuando se llega al target. No es binario check/uncheck — es un contador con feedback visual gradual.

**Estado**: No implementado. La frecuencia queda hardcodeada en `daily` por ahora. El schema ya soporta `target_per_period` y `frequency_type`, pero la UI no lo expone.
