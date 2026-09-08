// Verifica skills-lock.json contra los skills en disco.
//
// Warn-only por diseño: nunca hace fallar el arnés. Un parche local
// deliberado a un skill vendorizado no debe bloquear el trabajo; lo que se
// quiere es saber que existe.
//
// Se hashea el DIRECTORIO COMPLETO del skill, no solo SKILL.md. El lock v1
// hasheaba solo SKILL.md, y así se perdía por completo lo que de verdad hace
// el skill `brainstorming`: su lógica vive en scripts/{server.cjs,helper.js,
// start-server.sh,stop-server.sh} y en frame-template.html.
//
// Uso:  node scripts/check-skills-lock.mjs [--update]
// Sale: 0 siempre (salvo que el propio lock sea ilegible)

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const configFile = process.env.HARNESS_CONFIG ?? "harness.config.json";
const update = process.argv.includes("--update");

let cfg;
try {
  cfg = JSON.parse(readFileSync(configFile, "utf8"));
} catch (e) {
  console.log(`[WARN]  ${configFile} ilegible, se omite la verificación de skills: ${e.message}`);
  process.exit(0);
}

const lockFile = cfg?.harness?.skillsLock ?? "skills-lock.json";
const skillsDir = ".claude/skills";

if (!existsSync(lockFile)) {
  console.log(`[WARN]  No existe ${lockFile}, se omite la verificación de skills`);
  process.exit(0);
}

let lock;
try {
  lock = JSON.parse(readFileSync(lockFile, "utf8"));
} catch (e) {
  console.log(`[WARN]  ${lockFile} ilegible o JSON inválido: ${e.message}`);
  process.exit(0);
}

// Lista recursiva de archivos, ordenada, para que el hash sea estable
// independientemente del orden que devuelva el sistema de archivos.
function filesOf(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesOf(full));
    else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}

// Hash del directorio: ruta relativa + contenido de cada archivo, en orden.
function hashSkillDir(dir) {
  const hash = createHash("sha256");
  for (const file of filesOf(dir)) {
    hash.update(relative(dir, file).split("\\").join("/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const locked = lock.skills ?? {};
const onDisk = existsSync(skillsDir)
  ? readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

let warnings = 0;
const nextSkills = {};

for (const [name, entry] of Object.entries(locked)) {
  const dir = join(skillsDir, name);
  if (!existsSync(dir)) {
    console.log(`[WARN]  '${name}' está en ${lockFile} pero no en disco (${dir}/)`);
    warnings++;
    if (!update) nextSkills[name] = entry;   // con --update se elimina
    continue;
  }
  const actual = hashSkillDir(dir);
  const expected = entry.dirHash ?? null;    // v1 usaba computedHash sobre SKILL.md
  if (expected === null) {
    console.log(`[WARN]  '${name}' viene del lock v1 (hash solo de SKILL.md) — corre --update`);
    warnings++;
  } else if (expected !== actual) {
    console.log(`[WARN]  '${name}' modificado respecto a ${lockFile}`);
    warnings++;
  }
  nextSkills[name] = { ...entry, dirHash: actual };
  delete nextSkills[name].computedHash;
}

for (const name of onDisk) {
  if (!(name in locked)) {
    console.log(`[WARN]  '${name}' está en disco pero no en ${lockFile}`);
    warnings++;
    if (update) {
      nextSkills[name] = {
        source: "local",
        sourceType: "local",
        skillPath: `${name}/SKILL.md`,
        dirHash: hashSkillDir(join(skillsDir, name)),
      };
    }
  }
}

if (update) {
  const sorted = Object.fromEntries(Object.keys(nextSkills).sort().map((k) => [k, nextSkills[k]]));
  writeFileSync(lockFile, JSON.stringify({ version: 2, skills: sorted }, null, 2) + "\n");
  console.log(`[OK]    ${lockFile} regenerado (v2, hash de directorio completo, ${Object.keys(sorted).length} skills)`);
  process.exit(0);
}

if (warnings === 0) {
  console.log(`[OK]    ${lockFile} coincide con los skills en disco (${onDisk.length})`);
} else {
  console.log(`[WARN]  ${warnings} discrepancia(s) en skills — informativo, no bloquea. Corrige con: node scripts/check-skills-lock.mjs --update`);
}
process.exit(0);
