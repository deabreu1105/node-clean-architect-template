# Design — cli_stats

Este documento describe la arquitectura y decisiones técnicas para el comando `stats`.

## 1. Archivos a Modificar
- `src/cli.js`: Agregar función `cmdStats` y registrar el comando `stats` en la estructura `COMMANDS`.

## 2. Firmas y Componentes Nuevos

### `cmdStats(positional, flags)` en `src/cli.js`
- **Argumentos**:
  - `positional`: Array de argumentos posicionales. Si tiene longitud > 0, lanza `NoteError` (R5).
  - `flags`: No tiene flags registradas.
- **Flujo de Ejecución**:
  - Carga todas las notas de `storage.load()`.
  - Si no hay notas:
    - Escribe `sin notas\n` a `process.stdout` y retorna `0` (R3).
  - Si hay notas:
    - `total_notes`: Longitud del array de notas.
    - Ordena las notas por fecha de creación para obtener la nota más antigua (`oldest_date`) y la más reciente (`newest_date`).
    - Calcula la media de longitud del cuerpo de las notas: `Math.round(suma_cuerpos / total_notes)` (para obtener un entero).
    - Imprime cada par clave/valor en el formato requerido (R2):
      ```
      total_notes: <total_notes>
      oldest_date: <oldest_date>
      newest_date: <newest_date>
      avg_body_length: <avg_body_length>
      ```
    - Retorna `0`.

## 3. Manejo de Errores y Excepciones
- Reutiliza la excepción `NoteError` cuando se detectan argumentos adicionales posicionales (R5), devolviendo exit code `1` (a través del catch en `main`).

## 4. Alternativa Descartada y Justificación
- **Alternativa**: Crear un módulo separado `src/stats.js` que procese las métricas.
- **Justificación**: Se descarta porque el comando `stats` es sencillo y se puede resolver fácilmente de manera autocontenida en `src/cli.js` al igual que comandos como `count` y `recent`, evitando overhead innecesario.
