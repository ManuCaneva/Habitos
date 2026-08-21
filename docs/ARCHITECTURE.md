# Arquitectura y Stack Tecnológico

Este documento detalla el stack tecnológico, la estructura de componentes y las decisiones arquitectónicas que rigen el desarrollo de este proyecto. El objetivo principal es mantener una aplicación **Local-First, ultra liviana, estéticamente impecable y altamente escalable**.

---

## 1. Filosofía de Arquitectura: Local-First & Capas Separadas

La aplicación está diseñada bajo el principio **Offline-First / Local-First**. Todos los datos se procesan y almacenan en el dispositivo del usuario de forma nativa. Google Calendar es una integración opcional; no existe un servidor propio obligatorio.

### Flujo de Datos General
Vue + TypeScript (UI y Negocio) ➔ Tauri Commands ➔ Rust Backend ➔ SQLite (Persistencia)

> **REGLA DE ORO DEL DESARROLLO:**
> **Rust se utiliza única y exclusivamente como capa de infraestructura (I/O y acceso al sistema).**
> Toda la lógica de negocio (gestión de hábitos, cálculo de rachas, filtrado de tareas, estructuración del calendario semanal) se resuelve en el Frontend usando TypeScript. No se debe duplicar ni trasladar lógica de negocio al backend de Rust salvo fuerza mayor por rendimiento bruto.

---

## 2. El Stack Tecnológico

El proyecto se divide claramente en tres capas: Núcleo del Sistema, Motor del Frontend y Herramientas de Control de Datos.

### A. Núcleo del Sistema e Infraestructura
* **Tauri 2.0:** Se encarga del ciclo de vida de la aplicación, el manejo de ventanas nativas y la compilación multiplataforma para escritorio. Reemplaza el uso de entornos pesados como Electron utilizando los motores web nativos de cada S.O.
* **Rust:** Actúa como el backend local de escritorio, interactuando con las APIs del sistema operativo y exponiendo comandos seguros hacia el frontend.
* **SQLite:** Base de datos relacional local embebida. Toda la información del usuario se almacena en un único archivo local dentro del directorio de datos de la aplicación.

### B. Motor del Frontend e Interfaz
* **Vue 3 (Composition API):** Framework de interfaz basado en componentes monofichero (`.vue`). Permite una estructura modular donde el dashboard, el calendario y las listas de tareas coexisten de manera reactiva.
* **TypeScript:** Añade tipado estricto al frontend para garantizar la consistencia de los modelos de datos en todo el repositorio y evitar bugs en tiempo de ejecución.
* **Tailwind CSS:** Framework de estilos utilitarios utilizado para lograr una interfaz moderna, limpia, responsiva y con soporte nativo para modo oscuro sin sobrecargar el peso de la aplicación.

### C. Ecosistema de Librerías Críticas

| Herramienta | Propósito Exacto en el Proyecto |
| :--- | :--- |
| **Pinia** | Almacén de estado global. Centraliza los datos en memoria para que los componentes (ej: el calendario y la lista de hábitos) se comuniquen e interactúen en tiempo real. |
| **VueUse** | Colección de utilidades reactivas para interactuar con el sistema (control de atajos de teclado, detección de estado offline/online, persistencia rápida en almacenamiento local). |
| **Zod** | Validación de esquemas de datos en tiempo de ejecución. Protege la consistencia de la aplicación validando la estructura de las respuestas de APIs externas y archivos de configuración locales antes de ser procesados por Vue. |

La navegación actual no usa un router: `useUiStore` mantiene `viewMode` y `App.vue` renderiza la vista activa. Las llamadas asíncronas a SQLite y Google Calendar se coordinan desde los stores; no se usa TanStack Query.

---

## 3. Manejo de Assets e Identidad Visual

Para garantizar que la aplicación mantenga una estética idéntica y pulida sin importar si se ejecuta bajo el motor de Windows (WebView2) o Linux (WebKitGTK), se aplican las siguientes directrices:

* **Fuentes Locales:** Los archivos de fuentes tipográficas específicas (formatos `.woff2`) se almacenan directamente en el repositorio dentro de los recursos del frontend.
* **Inyección vía Tailwind:** La tipografía se declara localmente mediante `@font-face` y se extiende en el archivo de configuración de Tailwind para neutralizar las fuentes por defecto del sistema operativo.
