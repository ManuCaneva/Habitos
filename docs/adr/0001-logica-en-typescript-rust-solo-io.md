# Lógica de negocio en TypeScript, Rust solo como infraestructura

Decidimos que toda la lógica de negocio (cálculo de rachas, validación de inputs, decisiones de UI, generación de IDs, normalización de fechas) vive en el frontend (TypeScript / Vue 3). Rust es exclusivamente una capa de persistencia: Tauri commands delgados que hablan con SQLite. No se duplica ni traslada lógica de negocio al backend salvo fuerza mayor por rendimiento bruto.

El motivo es mantener una sola fuente de verdad para el comportamiento de la app, un solo lenguaje para el código de dominio (más fácil de testear con Vitest y de razonar para el desarrollador), y un backend que sea simple y auditable porque no contiene reglas de negocio. La contrapartida es que Rust no valida dominio, solo estructura de datos.

Esta decisión se refleja en `docs/ARCHITECTURE.md` y en `AGENTS.md` como "regla de oro". Un PR que agregue lógica de negocio en `src-tauri/` se rechaza.
