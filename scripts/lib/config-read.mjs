// Lector de harness.config.json para bash.
//
// Por qué existe: init.sh no puede asumir que jq esté instalado, y parsear JSON
// con sed/grep es una fuente de bugs. La regla del arnés es: **node es el lector
// de JSON, nada en bash parsea JSON**. Funciona porque init.sh §1 comprueba
// `command -v node` primero y literalmente, antes de leer cualquier config.
//
// Uso:  node scripts/lib/config-read.mjs <archivo> <ruta.con.puntos> [default]
// Sale: 0 con el valor por stdout (arrays, una línea por elemento)
//       2 si el archivo no existe o no es JSON válido
//       3 si la ruta no existe y no se dio un default

import { readFileSync } from "node:fs";

const [file, path, fallback] = process.argv.slice(2);

if (!file || !path) {
  console.error("[FAIL]  Uso: config-read.mjs <archivo> <ruta.con.puntos> [default]");
  process.exit(2);
}

let cfg;
try {
  cfg = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`[FAIL]  ${file} ilegible o JSON inválido: ${e.message}`);
  process.exit(2);
}

const value = path.split(".").reduce((obj, key) => (obj == null ? obj : obj[key]), cfg);

if (value === undefined) {
  if (fallback === undefined) {
    console.error(`[FAIL]  Falta la clave '${path}' en ${file}`);
    process.exit(3);
  }
  process.stdout.write(fallback);
} else {
  process.stdout.write(Array.isArray(value) ? value.join("\n") : String(value));
}
