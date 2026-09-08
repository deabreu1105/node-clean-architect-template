# Diseño de Feature: Archivado de Notas

Permite a los usuarios archivar notas en lugar de eliminarlas definitivamente, manteniéndolas ocultas de la lista principal pero disponibles para ser consultadas, editadas o restauradas.

## 1. Cambios Propuestos

### Modelo de Datos (`src/notes.js`)
- Añadir el campo `archived` (booleano) a la clase `Note`.
- Por defecto, `archived` será `false`.
- Actualizar el constructor y el método `toDict` para serializar y deserializar correctamente este campo.

### Comandos de CLI (`src/cli.js`)
- **`list`**:
  - Por defecto, filtrar y omitir notas que tengan `archived: true`.
  - Añadir soporte para el flag `--archived` (ej. `node src/cli.js list --archived`) para listar únicamente las notas archivadas.
- **`archive <id>`**:
  - Carga las notas, busca la nota por ID.
  - Si existe, cambia su atributo `archived` a `true` y guarda. Imprime confirmación.
  - Si no existe, lanza error en stderr y sale con exit code != 0.
- **`restore <id>`**:
  - Carga las notas, busca la nota por ID.
  - Si existe, cambia su atributo `archived` a `false` y guarda. Imprime confirmación.
  - Si no existe, lanza error en stderr y sale con exit code != 0.
- **`search`**:
  - Mantener comportamiento actual buscando en todas las notas (activas y archivadas) de forma predeterminada.

### Pruebas Unitarias e Integración (`tests/test_cli.js`)
- Añadir casos de prueba para:
  - Archivar una nota existente y verificar que no aparece en `list` estándar.
  - Listar notas archivadas usando `--archived`.
  - Restaurar una nota archivada y verificar que reaparece en `list` estándar.
  - Intentar archivar o restaurar una nota con ID inexistente y validar que retorna exit code != 0 y mensaje de error.

## 2. Criterios de Aceptación (Acceptance Criteria)
- `node src/cli.js archive <id>` marca la nota como archivada y confirma con un mensaje.
- `node src/cli.js restore <id>` desmarca la nota como archivada y confirma con un mensaje.
- `node src/cli.js list` no muestra notas archivadas.
- `node src/cli.js list --archived` muestra solo notas archivadas en formato usual `<id>\t<created_at>\t<title>`.
- Intentar archivar o restaurar un ID inexistente genera error en stderr y exit code != 0.
