// Valida feature_list.json y la correspondencia con specs/.
//
// Diferencias con el validador inline que vivía dentro de init.sh:
//   - Los estados válidos se leen de feature_list.json -> rules.valid_status,
//     en vez de redeclararse aquí (eran dos fuentes de verdad para lo mismo).
//   - Recoge TODOS los errores y los imprime juntos, en vez de salir en el
//     primero y ocultar el resto.
//   - Valida la forma completa: title, description, acceptance, y unicidad de
//     id y name (nada de eso se comprobaba).
//   - Avisa de specs huérfanos (un specs/<dir>/ que ninguna feature reclama).
//     Ese es exactamente el residuo que sobrevivió a la bifurcación anterior.
//   - `features: []` es VÁLIDO. Es la propiedad más importante para un
//     template: la forma nº1 de que un esqueleto nuevo salga rojo es un
//     validador que asume que hay al menos una feature.
//
// Uso:  node scripts/check-feature-list.mjs
// Sale: 0 si es válido · 1 si hay errores

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const configFile = process.env.HARNESS_CONFIG ?? "harness.config.json";

const errors = [];
const warnings = [];

let cfg;
try {
  cfg = JSON.parse(readFileSync(configFile, "utf8"));
} catch (e) {
  console.log(`[FAIL]  ${configFile} ilegible o JSON inválido: ${e.message}`);
  process.exit(1);
}

const h = cfg.harness ?? {};
const featureListFile = h.featureList ?? "feature_list.json";
const specsDir = h.specsDir ?? "specs";
const specFiles = h.specFiles ?? ["requirements.md", "design.md", "tasks.md"];
const statusesRequiringSpec = new Set(h.statusesRequiringSpec ?? ["spec_ready", "in_progress", "done"]);
const maxInProgress = h.maxInProgress ?? 1;

let data;
try {
  data = JSON.parse(readFileSync(featureListFile, "utf8"));
} catch (e) {
  console.log(`[FAIL]  ${featureListFile} ilegible o JSON inválido: ${e.message}`);
  process.exit(1);
}

// ── Forma del nivel superior ────────────────────────────────────────────────
if (typeof data.project !== "string" || data.project.trim() === "") {
  errors.push(`${featureListFile}: 'project' debe ser un string no vacío`);
}
if (typeof data.description !== "string" || data.description.trim() === "") {
  errors.push(`${featureListFile}: 'description' debe ser un string no vacío`);
}
if (data.rules === null || typeof data.rules !== "object" || Array.isArray(data.rules)) {
  errors.push(`${featureListFile}: falta el bloque 'rules' (es la fuente de verdad de las reglas de flujo)`);
}
if (!Array.isArray(data.features)) {
  errors.push(`${featureListFile}: 'features' debe ser un array (vacío es válido)`);
}

// ── Estados válidos: se leen de rules, no se redeclaran ─────────────────────
const declared = data.rules?.valid_status;
if (!Array.isArray(declared) || declared.length === 0 || !declared.every((s) => typeof s === "string")) {
  errors.push(`${featureListFile}: 'rules.valid_status' debe ser un array no vacío de strings`);
}
const validStatus = new Set(Array.isArray(declared) ? declared : []);

if (errors.length) {
  for (const e of errors) console.log(`[FAIL]  ${e}`);
  process.exit(1);
}

// ── Por feature ─────────────────────────────────────────────────────────────
const features = data.features;
const seenIds = new Map();
const seenNames = new Map();
const claimedNames = new Set();

for (const [i, f] of features.entries()) {
  const at = `feature #${i + 1}${f?.name ? ` (${f.name})` : ""}`;

  if (!Number.isInteger(f?.id)) {
    errors.push(`${at}: 'id' debe ser un entero`);
  } else if (seenIds.has(f.id)) {
    errors.push(`${at}: 'id' ${f.id} duplicado (ya lo usa ${seenIds.get(f.id)})`);
  } else {
    seenIds.set(f.id, at);
  }

  if (typeof f?.name !== "string" || !/^[a-z][a-z0-9_]*$/.test(f.name)) {
    errors.push(`${at}: 'name' debe ser snake_case y empezar por letra minúscula`);
  } else if (seenNames.has(f.name)) {
    errors.push(`${at}: 'name' duplicado (ya lo usa ${seenNames.get(f.name)})`);
  } else {
    seenNames.set(f.name, at);
    claimedNames.add(f.name);
  }

  if (typeof f?.title !== "string" || f.title.trim() === "") {
    errors.push(`${at}: 'title' debe ser un string no vacío`);
  }
  if (typeof f?.description !== "string" || f.description.trim() === "") {
    errors.push(`${at}: 'description' debe ser un string no vacío`);
  }
  if (!Array.isArray(f?.acceptance) || f.acceptance.length === 0 ||
      !f.acceptance.every((a) => typeof a === "string" && a.trim() !== "")) {
    errors.push(`${at}: 'acceptance' debe ser un array no vacío de strings no vacíos`);
  }
  if (typeof f?.sdd !== "boolean") {
    errors.push(`${at}: 'sdd' debe ser booleano`);
  }
  if (typeof f?.api !== "boolean") {
    errors.push(`${at}: 'api' debe ser booleano`);
  }
  if (!validStatus.has(f?.status)) {
    errors.push(`${at}: estado inválido '${f?.status}' (válidos: ${[...validStatus].join(", ")})`);
  }

  // Triple de specs obligatorio según el estado
  if (f?.sdd === true && statusesRequiringSpec.has(f?.status) && typeof f?.name === "string") {
    const dir = join(specsDir, f.name);
    for (const spec of specFiles) {
      if (!existsSync(join(dir, spec))) {
        errors.push(`${at} en '${f.status}' sin ${join(dir, spec)}`);
      }
    }
  }
}

// ── Una sola feature en curso ───────────────────────────────────────────────
const inProgress = features.filter((f) => f?.status === "in_progress");
if (inProgress.length > maxInProgress) {
  errors.push(`Hay ${inProgress.length} features en 'in_progress' (máximo ${maxInProgress}): ` +
              inProgress.map((f) => f.name).join(", "));
}

// ── Specs huérfanos: warn, no error ─────────────────────────────────────────
if (existsSync(specsDir)) {
  const orphans = readdirSync(specsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !claimedNames.has(d.name))
    .map((d) => d.name);
  for (const o of orphans) {
    warnings.push(`${join(specsDir, o)}/ no lo reclama ninguna feature de ${featureListFile}`);
  }
}

// ── Veredicto ───────────────────────────────────────────────────────────────
for (const w of warnings) console.log(`[WARN]  ${w}`);

if (errors.length) {
  for (const e of errors) console.log(`[FAIL]  ${e}`);
  process.exit(1);
}

console.log(`[OK]    ${featureListFile} válido (${features.length} features, ${inProgress.length} en curso)`);
console.log(`[OK]    Specs presentes para las features sdd que los requieren`);
process.exit(0);
