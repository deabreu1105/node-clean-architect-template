// Comprueba que los archivos base del arnés existen.
//
// Dos niveles, y la distinción importa:
//   requiredFiles  -> los que la maquinaria necesita de verdad. Falta uno: FAIL.
//   expectedFiles  -> documentación. Falta uno: WARN.
//
// Por qué: la bifurcación anterior de este arnés estuvo roja durante meses
// porque init.sh exigía un CHECKPOINTS.md que no existía y salía 1 siempre.
// Un doc renombrado o movido no debe poner el arnés en rojo; un package.json
// ausente sí.
//
// Uso:  node scripts/check-base-files.mjs
// Sale: 0 si están todos los requeridos (con o sin warnings) · 1 si falta alguno

import { existsSync, readFileSync } from "node:fs";

const configFile = process.env.HARNESS_CONFIG ?? "harness.config.json";

let cfg;
try {
  cfg = JSON.parse(readFileSync(configFile, "utf8"));
} catch (e) {
  console.log(`[FAIL]  ${configFile} ilegible o JSON inválido: ${e.message}`);
  process.exit(1);
}

const required = cfg?.harness?.requiredFiles ?? [];
const expected = cfg?.harness?.expectedFiles ?? [];

if (!Array.isArray(required) || required.length === 0) {
  console.log(`[FAIL]  ${configFile} no declara harness.requiredFiles`);
  process.exit(1);
}

let failed = 0;

for (const file of required) {
  if (existsSync(file)) {
    console.log(`[OK]    Existe ${file}`);
  } else {
    console.log(`[FAIL]  Falta archivo requerido: ${file}`);
    failed++;
  }
}

for (const file of expected) {
  if (!existsSync(file)) {
    console.log(`[WARN]  Falta archivo esperado (documentación): ${file}`);
  }
}

if (failed > 0) {
  console.log(`[FAIL]  ${failed} archivo(s) requerido(s) ausente(s) — ver harness.requiredFiles en ${configFile}`);
  process.exit(1);
}

console.log(`[OK]    ${required.length} archivos requeridos presentes`);
process.exit(0);
