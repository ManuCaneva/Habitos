# IDEAS.md

> **Uso de este archivo**: Este archivo es un mapa conceptual compartido entre el developer y la AI. No es documentación técnica ni specs formales. Se consulta **explícitamente** cuando se quiere profundizar en una feature, explorar alternativas o tomar decisiones de diseño. Está pensado para ser editado y refactoreado a medida que el proyecto evoluciona.

---

## Visión general

Transformar la app de hábitos en una **aplicación centralizada de productividad** que permita gestionar tiempo, tareas, proyectos y conocimiento personal de forma unificada y personalizable.

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
