# 08: chore(release) — bump de versión a 1.0.0

**What to build:** La primera release pública se etiqueta `v1.0.0`, pero los manifiestos siguen en `0.1.0`. Subir la versión a `1.0.0` en los tres lugares (manifiesto del frontend, config de Tauri y crate de Rust) y actualizar el `Cargo.lock`. Debe coincidir el tag con la versión que tauri-action usa para nombrar el release.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Los tres manifiestos declaran `1.0.0`.
- [x] `Cargo.lock` actualizado (build de Rust en verde).
- [x] `npm run build` y `cargo check` pasan.
