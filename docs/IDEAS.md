# IDEAS.md

> **Uso de este archivo**: Este archivo es un mapa conceptual compartido entre el developer y la AI. No es documentación técnica ni specs formales. Se consulta **explícitamente** cuando se quiere profundizar en una feature, explorar alternativas o tomar decisiones de diseño. Está pensado para ser editado y refactoreado a medida que el proyecto evoluciona.

---

## Visión general

Transformar la app de hábitos en una **aplicación centralizada de productividad** que permita gestionar tiempo, tareas, proyectos y conocimiento personal de forma unificada y personalizable.

---

## 0. Pantalla de inicio / Onboarding

**Estado: (Por hacer)**

Idea general para la primera vez que se inicia la app:

- Pantalla de bienvenida con el logo y nombre de la app
- Introducción breve a las funcionalidades principales
- Posibilidad de crear una cuenta o continuar como invitado (si hay sync en el futuro)
- Setup inicial rápido: elegir qué widgets mostrar en el dashboard
- Tutorial interactivo corto o tooltips guiados
- Enlace a documentación o soporte

---

## 1. Dashboard y Widgets

> **Concepto**: El dashboard es una grilla de **contenedores/widgets** independientes. El usuario puede organizarlos, moverlos, redimensionarlos o esconderlos.

### Sistema de grilla
**Estado: (Terminado)**
- Grilla de 12 columnas con posiciones en porcentajes
- Drag & drop para mover widgets
- Redimensionamiento con límites mínimos
- Persistencia del layout en config (SQLite)
- WidgetPicker para agregar/quitar widgets
- Reset a layout por defecto

### Widget: Hábitos
**Estado: (En progreso)**
- Lista de hábitos del día con check-in
- Heatmap de historial
- Rachas (streaks) por hábito
- Archivado de hábitos
- Context menu por hábito
- **Pendiente**: multi-check-in progresivo (hábitos con N repeticiones por día, ej: "Tomar 8 vasos de agua")

### Widget: Tareas
**Estado: (En progreso)**
- Lista de tareas dentro del dashboard
- Sub-tareas / pasos (checklist anidada)
- Color asignable por tarea
- Descripción
- Fecha de vencimiento (due_date)
- Estados: todo / doing / done
- Crear, editar, eliminar tareas
- Ordenamiento manual (sort_order)
- **Pendiente**: contador visual de falta ("Faltan 3 días", barra de progreso, indicador de urgencia)
- **Pendiente**: etiquetas / tags flexibles
- **Pendiente**: prioridades (P1-P4)
- **Pendiente**: vista Kanban (tableros tipo Trello)
- **Pendiente**: recurring tasks (tareas que se repiten con deadline)
- **Pendiente**: quick capture / inbox (captura rápida)
- **Pendiente**: palette de comandos (Ctrl+K)

### Widget: Objetivos
**Estado: (Terminado)**
- Seguimiento de objetivos con métricas cuantificables (ej: "Leer 10 páginas por día")
- Diferencia con hábitos: se cumplen cuando pasan cosas específicas, no son un check binario
- Descripción de qué se necesita cumplir
- Métrica de progreso (ej: 7/10 páginas hoy)
- Frecuencia: diario, semanal, intervalo personalizado
- Indicador visual de cumplimiento
- GoalLogs para registrar avance
- Archivado de objetivos
- Context menu por objetivo

### Widget: Calendario anual
**Estado: (En progreso)**
- Vista de calendario anual completo (12 meses en grid responsive)
- Conexión con Google Calendar: OAuth 2.0 PKCE vía deep-link
- Eventos de Google como puntos de color por día (3 dots max + overflow)
- Navegación entre años con `<` `>`
- Botón Conectar/Desconectar en SettingsView
- Fetch on-demand (sin cache persistente)
- Días ordenados domingo primero
- **Pendiente**: crear Google Cloud OAuth credentials (Client ID) y setear `VITE_GCAL_CLIENT_ID`

### Widget: Cronograma semanal
**Estado: (Terminado)**
- Grilla de días vs franjas horarias
- Bloques de actividades en slots específicos (materias, gimnasio, trabajo, etc.)
- Drag & drop para mover bloques
- Bloques coloreables por categoría
- Vista semanal con scroll vertical en el eje de tiempo
- Modal para crear/editar bloques
- Settings modal para configuración

---

## 2. Calendario integrado

**Estado: (Por hacer)**
- Vista diaria / semanal / mensual
- Drag & drop de eventos
- Sincronización con Google Calendar / iCal
- (El widget de calendario anual ya está implementado; esto es un módulo de calendario completo)

---

## 3. Pomodoro / Timer

**Estado: (Por hacer)**
- Configuración de duración de sesiones (trabajo / descanso / descanso largo)
- Pomodoros vinculados a hábitos o tareas
- Conteo de pomodoros completados por día
- Historial de sesiones
- Presets configurables (ej: estudio 50/10, trabajo 25/5)

---

## 4. Planificador diario

**Estado: (Por hacer)**
- Vista tipo "daily planner"
- Combinar hábitos + tareas + eventos del día en una sola vista
- Drag & drop para reordenar prioridades

---

## 5. Proyectos

**Estado: (Por hacer)**
- Agrupar tareas + hábitos bajo un proyecto
- Fecha de inicio y fin estimada
- Milestones / hitos dentro de proyectos
- Barras de progreso
- Tiempo estimado vs real
- Templates de proyectos recurrentes
- Duplicar estructura de proyecto existente

---

## 6. Notas / Knowledge

**Estado: (Por hacer)**
- Notas rápidas tipo Apple Notes, vinculables a tareas, proyectos o hábitos
- Journaling diario con prompts
- Mood tracking integrado
- Exportar datos de hábitos
- Gráficos de streaks y tendencias
- Estadísticas personales a lo largo del tiempo

---

## 7. Gamificación y motivación

**Estado: (Por hacer)**
- Sistema de puntos / XP por completar tareas y hábitos
- Streaks globales (racha general de productividad, no solo por hábito)
- Logros / achievements (badges por hitos alcanzados)
- Dashboard con métricas: tiempo enfocado, tareas completadas, hábitos activos

---

## 8. Personalización

### Temas
**Estado: (Terminado)**
- Modo claro / oscuro
- Toggle en sidebar
- Persistencia en localStorage

### Plugins / extensiones
**Estado: (Por hacer)**
- Sistema de módulos activables / desactivables
- El usuario elige qué features tiene visibles

### Views custom
**Estado: (Por hacer)**
- El usuario crea sus propias vistas (tipo Notion databases)
- Filtros avanzados por fecha, tag, proyecto, estado

### Shortcuts personalizables
**Estado: (Por hacer)**
- Atajos de teclado configurables

---

## 9. Integraciones

**Estado: (Por hacer)**
- Sync entre dispositivos (cloud sync opcional con encriptación)
- Webhooks / API para conectar con otros servicios
- Import / Export (CSV, JSON)

---

## Roadmap actualizado

| Fase | Features | Estado |
|------|----------|--------|
| 0 | **Pantalla de inicio / Onboarding** | Por hacer |
| 1 | **Dashboard + Widgets** (Hábitos, Tareas, Objetivos, Calendario anual, Cronograma semanal) | Parcialmente terminado (calendario anual y tareas: en progreso) |
| 2 | **Calendario integrado** (vistas diaria/semanal/mensual) | Por hacer |
| 3 | **Proyectos** | Por hacer |
| 4 | **Quick capture / Inbox** | Por hacer |
| 5 | **Gamificación** | Por hacer |
| 6 | **Notas / Journaling** | Por hacer |
| 7 | **Pomodoro** | Por hacer |
| 8 | **Personalización extrema** (plugins, views custom, shortcuts) | Parcialmente terminado (temas hecho) |

---

## Notas abiertas

- *Agregar aquí decisiones de diseño, dudas pendientes, o ideas que surjan durante el desarrollo.*
