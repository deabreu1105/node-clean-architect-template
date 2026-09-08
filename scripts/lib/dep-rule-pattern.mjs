// Construye la expresión regular extendida (ERE) del guard de la Regla de
// Dependencia a partir de harness.config.json.
//
// Este archivo es la ÚNICA fuente de esa expresión en todo el repositorio.
// Antes vivía duplicada en cuatro sitios (init.sh, CHECKPOINTS.md C2,
// docs/verification.md Nivel 2 y .claude/agents/reviewer.md), lo que obligaba a
// editarla en todos a la vez. Ahora esos cuatro invocan
// scripts/check-dependency-rule.sh, que llama aquí.
//
// Uso:  node scripts/lib/dep-rule-pattern.mjs [--explain]

import { readFileSync } from "node:fs";

const configFile = process.env.HARNESS_CONFIG ?? "harness.config.json";

let cfg;
try {
  cfg = JSON.parse(readFileSync(configFile, "utf8"));
} catch (e) {
  console.error(`[FAIL]  ${configFile} ilegible o JSON inválido: ${e.message}`);
  process.exit(2);
}

const layers = cfg?.layers;
if (!layers || !Array.isArray(layers.outer) || !Array.isArray(layers.bannedInInner)) {
  console.error(`[FAIL]  ${configFile} necesita layers.outer y layers.bannedInInner (arrays)`);
  process.exit(2);
}

// Escapa los metacaracteres de ERE. Los nombres de capa y de paquete vienen de
// la config, así que un punto en un nombre de paquete (p. ej. "socket.io") no
// debe convertirse en un comodín.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const outerAlt = layers.outer.map(escape).join("|");
const bannedAlt = layers.bannedInInner.map(escape).join("|");

// Dos alternativas:
//   1. import relativo hacia una capa externa:  from '../../infrastructure/...'
//   2. import de un paquete prohibido:          from 'mongoose'
const pattern = `from ['"](\\.\\./)*(${outerAlt})/|from ['"](${bannedAlt})['"]`;

if (process.argv.includes("--explain")) {
  console.log(`Guard de la Regla de Dependencia — generado desde ${configFile}\n`);
  console.log(`Capa interna vigilada : ${layers.sourceRoot}/${layers.inner}`);
  console.log(`Capas externas vetadas: ${layers.outer.join(", ")}`);
  console.log(`Paquetes vetados      : ${layers.bannedInInner.join(", ")}`);
  console.log(`Extensión analizada   : *.${(cfg.stack?.sourceExtensions ?? ["ts"])[0]}`);
  console.log(`\nERE resultante:\n${pattern}`);
  console.log(`\nLos archivos *.test.* quedan excluidos: un test SÍ puede importar`);
  console.log(`de una capa externa para construir un fake.`);
  process.exit(0);
}

process.stdout.write(pattern);
