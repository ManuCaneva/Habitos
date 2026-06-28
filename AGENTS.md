# AGENTS.md

Convenciones operativas para los agentes (humanos y AI) que trabajan en este proyecto.

## Regla de oro: lógica en TypeScript, no en Rust

Toda la lógica de negocio (cálculo de rachas, validación de inputs, decisiones de UI, generación de IDs, normalización de fechas) vive en el frontend (TypeScript / Vue 3). Rust es **solo infraestructura de persistencia** (Tauri commands que hablan con SQLite). Si un PR agrega lógica de negocio en `src-tauri/`, se rechaza.

## Metodología: TDD

Este proyecto usa **TDD estricto**. Antes de tocar código de implementación, escribí el test que captura el comportamiento esperado, corrélo rojo, después escribí la implementación que lo hace pasar.

### Flujo

1. Escribir el test que captura el comportamiento deseado (debe fallar o describir un comportamiento que no existe).
2. Correr `npm run test` y confirmar que el test **falla por la razón correcta** (no por error de import o typo).
3. Escribir el código mínimo para que pase.
4. Correr `npm run test` de nuevo y confirmar verde.
5. Refactorizar con confianza.
6. Correr `npm run build` para confirmar tipos y producción.

### Cuándo no aplica TDD

- Cambios puramente de UI (texto, color, espaciado) que no tienen lógica testeable.
- Configuración (package.json, vite.config.ts, tailwind.config.ts).
- Documentación (README, AGENTS.md, docs/).

Para esos cambios, una verificación manual con `npm run dev` o `npm run tauri dev` es suficiente.

## Tests

### Comandos

- `npm run test` — corre toda la suite una vez (modo CI).
- `npm run test:watch` — corre en modo watch para el ciclo TDD.
- `npm run build` — corre typecheck y build. **Pasar esto antes de considerar terminado un cambio**.

### Ubicación

- Tests unitarios van **al lado** del código que prueban: `foo.ts` se testea con `foo.test.ts` en el mismo directorio.
- Configuración de Vitest en `vitest.config.ts`.
- Setup global en `src/test/setup.ts` (limpia `localStorage` entre tests).

### Qué testear (por capa)

| Capa | Qué testear | Ejemplo |
|------|-------------|---------|
| `src/schemas/` | Reglas de validación Zod, casos válidos y rechazados | `habits.test.ts` |
| `src/lib/` | Funciones puras (helpers, mappers, constantes) | `habitColors.test.ts` |
| `src/stores/` | Lógica de dominio que no toca I/O: racha, frecuencia, normalización. Las llamadas a `db.*` se mockean con `vi.mock()`. | `habits.test.ts` |
| `src/components/` | Componentes Vue con `@vue/test-utils` (props, emits, render condicional) | `HabitRow.test.ts` |
| `src/views/` | Similar a components, verificar que cambia con el store | `TodayView.test.ts` |

### Mocking de Tauri

La capa `src/lib/db.ts` envuelve `invoke()` de Tauri. En tests, **mockear todo el módulo**:

```ts
import { vi } from "vitest";

vi.mock("@/lib/db", () => ({
  listHabits: vi.fn().mockResolvedValue([]),
  createHabit: vi.fn().mockResolvedValue({ /* habit row */ }),
  // ...
}));
```

No levantar el runtime de Tauri en tests unitarios. Tests de integración que abren la app real viven en otro lado (o se omiten por ahora).

## Stack y decisiones inmutables

- **Frontend**: Vue 3.5 + TypeScript + Pinia + VueUse + Zod + Tailwind 3.4
- **Backend**: Tauri 2 + Rust + rusqlite (bundled, sin CGO)
- **Persistencia**: SQLite local en `app_data_dir/habitos.sqlite` (WAL mode)
- **Validación**: dual layer Zod (dominio + row) cruzando la frontera Tauri
- **Estilos**: tokens de `docs/DESIGN.md` via Tailwind, no hardcodear colores/tamaños en componentes
- **Componentes UI**: en `src/components/ui/`. No agregar dependencias de UI nuevas sin discutir.
- **Aliases**: `@/*` → `src/*` (configurado en tsconfig y vite)

## Estructura de archivos

```
src/
  components/
    ui/          primitivos reusables (Button, Input, Modal, etc)
    layout/      chrome de la app (TopBar, TabBar)
    habits/      específicos del dominio
  composables/   hooks Vue reutilizables
  lib/           helpers puros (no componentes)
  schemas/       Zod: domain + row + drafts + mappers
  stores/        Pinia stores (orquestación + lógica de dominio)
  views/         vistas (TodayView, ArchivedView, SettingsView)
src-tauri/
  src/
    commands/    Tauri commands (delgados, delegan a db)
    db/          rusqlite, migrations
docs/
  ARCHITECTURE.md   reglas de stack + regla Rust=I/O
  DESIGN.md         design system (tokens)
  AGENTS.md         este archivo
  README_example.md template de README (no se commitea en producción)
```

## Antes de hacer un commit

- [ ] `npm run test` pasa
- [ ] `npm run build` pasa (types + build)
- [ ] `cargo check` pasa (si tocaste Rust)
- [ ] No hay TODOs ni código comentado
- [ ] Mensaje de commit describe el **qué** y el **por qué**, no el **cómo**

## Antes de pedir review

Si el cambio es más de 50 líneas, o toca la arquitectura, o agrega una dependencia nueva, abrí un PR con descripción y screenshot. Cambios chicos (typo, fix de bug puntual) van directo a main.
