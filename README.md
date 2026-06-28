<br />
<div align="center">
  <h3 align="center">Hábitos</h3>
  <p align="center">
    Tracker de hábitos <strong>local-first</strong> minimalista para escritorio.<br />
    Inspirado en el design system de Linear, pensado para ser compartible.<br />
    <a href="docs/ARCHITECTURE.md"><strong>Arquitectura »</strong></a>
    ·
    <a href="docs/DESIGN.md"><strong>Design system »</strong></a>
    ·
    <a href="AGENTS.md"><strong>AGENTS »</strong></a>
  </p>
</div>

---

## Sobre el proyecto

Hábitos es un tracker de hábitos **local-first** para escritorio. Tus datos viven en tu máquina, sin cuentas ni servidores remotos. La app está pensada para ser compartible con quien quiera adoptarla, con una arquitectura simple donde la lógica vive en el frontend y Rust solo persiste.

**MVP-1 (actual)**: hábitos diarios binarios con racha estricta. Vista de Hoy / Archivados / Settings, modal único de crear/editar, tema claro/oscuro.

**MVP-2+**: semanales con días específicos, integración con Google Calendar, activities con horarios, recordatorios.

### ¿Por qué?

- Las apps de hábitos existentes son o demasiado simples o demasiado complicadas. Quería algo con la pulcritud visual de Linear y la simplicidad de Things.
- **Local-first importa**: la app tiene que ser útil offline, sin telemetría, sin suscripción.
- **Compartible**: si a alguien le sirve, que pueda clonar y usar sin fricción.

## Stack

**Frontend**: Vue 3.5 · TypeScript (strict) · Pinia · Vite 6 · Zod · VueUse · Tailwind 3.4 · lucide-vue-next · Inter + JetBrains Mono

**Backend (Tauri shell)**: Tauri 2 · rusqlite (bundled) · thiserror

**Testing**: Vitest 4 con @vue/test-utils y happy-dom

## Empezando

### Prerrequisitos

- **Node.js 20+**
- **Rust stable** (vía [rustup](https://rustup.rs))
- **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`, `libsqlite3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`. Ver [Tauri Linux prereqs](https://v2.tauri.app/start/prerequisites/#linux).
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Windows**: WebView2 (preinstalado en Windows 11) + MSVC build tools

### Instalación

```sh
git clone https://github.com/tu-usuario/habitos.git
cd habitos
npm install
npm run tauri dev
```

La primera compilación de Rust tarda 1–2 minutos; las siguientes son segundos.

## Uso

1. Click en **Nuevo hábito** (arriba a la derecha)
2. Escribir el nombre, elegir un color, **Crear**
3. Marcar el checkbox del hábito cada día
4. La columna de la derecha muestra la racha actual (días consecutivos)

**Archivar**: hover sobre un hábito → click en `…` → **Archivar**. Los hábitos archivados no suman racha pero conservan su historial. Viv en la tab **Archivados** y se pueden restaurar.

**Settings**: tab del ícono ⚙. Toggle de tema claro/oscuro (la elección se guarda en `localStorage`).

**Datos**: la DB SQLite vive en

- Linux: `~/.local/share/com.goya.habitos/habitos.sqlite`
- macOS: `~/Library/Application Support/com.goya.habitos/habitos.sqlite`
- Windows: `%APPDATA%/com.goya.habitos/habitos.sqlite`

Para resetear, cerrá la app y borrá ese archivo.

## Tests

```sh
npm run test          # suite completa, una vez
npm run test:watch    # modo watch (ciclo TDD)
npm run build         # typecheck + build de producción
```

Los tests viven al lado del código que prueban (`foo.ts` → `foo.test.ts`). Cubren:

- Schemas Zod (validación de entrada y de filas de SQLite)
- Helpers puros (`src/lib/`)
- Lógica de dominio en stores (con `db.*` mockeado)
- Componentes Vue críticos (con `@vue/test-utils`)

Para la convención de tests y TDD, ver [AGENTS.md](AGENTS.md).

## Roadmap

**MVP-1 — Hábitos diarios (actual)**

- [x] Schema SQLite + migraciones
- [x] Dual Zod (domain + row) cruzando la frontera Tauri
- [x] Pinia store con rachas
- [x] UI: TopBar, TabBar, Today/Archived/Settings views
- [x] Modal único de crear/editar con paleta de 8 colores
- [x] Tema claro/oscuro con persistencia
- [x] Tests de schemas con Vitest

**MVP-2 — Hábitos semanales con días específicos**

- [ ] Frecuencia `weekly` con `days_of_week` editable (JSON en la columna)
- [ ] UI: heatmap semanal en cada `HabitRow`

**MVP-3 — Activities con horarios**

- [ ] Nueva entidad `activities` (bloques de tiempo, no recurrentes)
- [ ] Vista semanal tipo calendario

**MVP-4 — Google Calendar sync**

- [ ] OAuth 2.0
- [ ] Sync bidireccional de activities

**MVP-5 — Recordatorios nativos**

- [ ] Notificaciones del sistema al cierre de cada ventana horaria

## Contribuir

1. Fork el proyecto
2. Crear una rama para el feature (`git checkout -b feature/algo-genial`)
3. Seguir TDD: primero el test, después la implementación. Ver [AGENTS.md](AGENTS.md).
4. Commit con mensaje descriptivo
5. Push y abrir un Pull Request

## Licencia

MIT — ver `LICENSE.txt`.
