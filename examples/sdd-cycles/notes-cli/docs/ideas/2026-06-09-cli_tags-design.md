# Diseño de Idea: Note Tagging (`cli_tags`)

Fecha: 2026-06-09
Tema: Añadir soporte para etiquetas (tags) en el CLI de notas.

## Contexto

El proyecto notes-cli permite crear, listar, ver, buscar, editar, contar, exportar y borrar notas. Para mejorar la organización de las notas, se propone la capacidad de etiquetarlas (tags), permitiendo buscar notas asociadas a etiquetas específicas.

---

## Alternativas Consideradas

### Alternativa 1: Campo `tags` embebido en cada nota (Elegida)
- **Descripción**: Añadir una propiedad `tags` (array de strings) a la estructura JSON de la nota.
- **Pros**: Mantiene el archivo simple y unificado. Conserva la consistencia de almacenamiento.
- **Contras**: Incrementa mínimamente el tamaño del archivo JSON.

### Alternativa 2: Archivo de etiquetas separado o índice invertido
- **Descripción**: Mantener un archivo separado que mapee etiquetas a IDs de notas.
- **Pros**: Búsquedas por tag potencialmente más rápidas si el volumen de datos fuera inmenso.
- **Contras**: Rompe la atomicidad simple de un solo archivo y añade gran complejidad de sincronización.

---

## Diseño Técnico

### 1. Modelo de Dominio (`src/notes.js`)

Se modificará el constructor de `Note` y su método de creación `Note.new()` para:
- Aceptar una propiedad opcional `tags` (array de strings, por defecto `[]`).
- Formatear y limpiar los tags (eliminar espacios en blanco y convertirlos a minúsculas).
- Congelar el objeto con `Object.freeze`.

```javascript
// Estructura de Note serializada
{
  "id": 1,
  "title": "Título",
  "body": "Cuerpo",
  "created_at": "2026-06-09T12:00:00.000Z",
  "tags": ["personal", "trabajo"]
}
```

### 2. Comandos CLI (`src/cli.js`)

Se añadirán y adaptarán opciones utilizando `node:util.parseArgs`:

- **Comando `add`**:
  - Flags `--tag` / `--tags` (tipo `string`, `multiple: true`).
  - Permite especificar tags de ambas formas: `--tags "personal,trabajo"` o `--tag personal --tag trabajo`.
  
- **Comando `edit`**:
  - Flags `--tag` / `--tags` para reescribir por completo la lista de tags.
  - Flags `--add-tag` / `--add-tags` para añadir tags de forma aditiva (sin duplicados).
  - Flags `--remove-tag` / `--remove-tags` para remover tags.
  
- **Comando `show <id>`**:
  - Imprime la línea de tags: `Tags: personal, trabajo` (si existen).
  - Si no tiene tags, imprime `Tags: (ninguno)`.

- **Comando `search-tag <tag>`**:
  - Nuevo comando.
  - Realiza una búsqueda substring case-insensitive en las etiquetas de todas las notas.
  - Retorna código de salida 1 si no encuentra coincidencias, con un mensaje adecuado en stderr.
  - Output en stdout (formato extendido): `<id>\t<created_at>\t<title>\t[tag1, tag2]`.

---

## Acceptance Criteria Propuestos

1. Al crear una nota con `--tag personal --tags "trabajo, urgente"`, la nota se guarda con `tags: ["personal", "trabajo", "urgente"]`.
2. Al ejecutar `show <id>`, si la nota tiene tags, imprime `Tags: personal, trabajo, urgente` en la tercera línea del output. Si no tiene, imprime `Tags: (ninguno)`.
3. Al ejecutar `edit <id> --tags "viaje"`, los tags anteriores son completamente reemplazados por `["viaje"]`.
4. Al ejecutar `edit <id> --add-tag "ocio"`, se conserva `viaje` y se añade `ocio`. No se permiten duplicados.
5. Al ejecutar `edit <id> --remove-tag "viaje"`, se elimina `viaje` y queda solo `ocio`.
6. El comando `search-tag <patron>` busca case-insensitive por substring dentro del array de tags.
7. `search-tag` imprime cada coincidencia en formato `<id>\t<created_at>\t<title>\t[tags]`.
8. Si `search-tag` no produce resultados, sale con exit code 1.
