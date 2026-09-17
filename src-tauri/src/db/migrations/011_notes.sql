-- 011_notes: tabla de notas del widget "Notas".
-- Nota = anotación de texto libre sin fecha, estados ni archivado.
-- El título es opcional (una nota puede ser solo descripción y viceversa);
-- la regla "al menos un campo no vacío" se valida en el frontend (Zod),
-- Rust es solo I/O.
CREATE TABLE notes (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    description TEXT,
    color       TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
