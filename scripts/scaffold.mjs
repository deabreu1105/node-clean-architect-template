#!/usr/bin/env node
// scaffold.mjs — instancia un proyecto nuevo a partir del template.
//
// Reescribe nombres y comandos, resetea el estado del arnés y verifica que todo
// queda en verde. Cero dependencias: solo node:*.
//
// El DRY-RUN es el default. Sin --apply no toca nada: imprime el plan completo
// de archivo -> operación y sale.
//
//   node scripts/scaffold.mjs                    # plan, no escribe
//   node scripts/scaffold.mjs --apply            # interactivo, escribe
//   node scripts/scaffold.mjs --apply --yes --name mi-api --port 3000
//
// Este script NO se autoborra a propósito. El fallo que todo el template
// pretende evitar es la enésima bifurcación a mano, y conservarlo permite
// re-correrlo (renombrar, cambiar de puerto) y, sobre todo, diffear tu scaffold
// contra el de un template actualizado para ver qué ha aprendido el arnés. El
// guard de .harness/scaffolded.json ya evita re-corridas accidentales.
//
// TRAMPA DOCUMENTADA: tsconfig.json es JSONC (lleva comentarios // y una coma
// final). Este script NUNCA le hace JSON.parse. Tampoco necesita tocarlo: no
// contiene nada específico del proyecto. Si algún día añades templating de
// tsconfig, edítalo como texto.

import { createInterface } from "node:readline/promises";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
process.chdir(ROOT);

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const APPLY = has("--apply");
const YES = has("--yes");
const FORCE = has("--force");
const NO_GIT = has("--no-git");

const MARKER = ".harness/scaffolded.json";
const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn"];

// ── Comandos por gestor de paquetes ──────────────────────────────────────────
const commandsFor = (pm) => ({
  pnpm: { install: "pnpm install", dev: "pnpm dev", build: "pnpm build", typecheck: "pnpm typecheck", test: "pnpm test", apicheck: "pnpm api:check" },
  npm:  { install: "npm install",  dev: "npm run dev", build: "npm run build", typecheck: "npm run typecheck", test: "npm test", apicheck: "npm run api:check" },
  yarn: { install: "yarn install", dev: "yarn dev", build: "yarn build", typecheck: "yarn typecheck", test: "yarn test", apicheck: "yarn api:check" },
}[pm]);

// ── Plan de operaciones: se imprime en dry-run, se ejecuta con --apply ───────
const plan = [];
const op = (label, fn) => plan.push({ label, fn });

const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));
const writeJson = (f, obj) => writeFileSync(f, JSON.stringify(obj, null, 2) + "\n");

function templateRevision() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "desconocida (copia sin historia git)";
  }
}

// ── Preguntas ────────────────────────────────────────────────────────────────
async function ask() {
  const defaults = {
    name: arg("name") ?? "mi-proyecto",
    displayName: arg("display-name"),
    description: arg("description") ?? "",
    packageManager: arg("package-manager") ?? "pnpm",
    port: arg("port") ?? "3000",
    keepExamples: !has("--drop-examples"),
  };

  if (YES) {
    defaults.displayName ??= defaults.name;
    return defaults;
  }

  const rl = createInterface({ input, output });
  const q = async (text, def) => {
    const a = (await rl.question(`  ${text}${def ? ` [${def}]` : ""}: `)).trim();
    return a === "" ? def : a;
  };

  console.log("\nScaffold del proyecto — Enter acepta el valor entre corchetes.\n");
  const answers = {};
  answers.name = await q("Nombre del proyecto (kebab-case)", defaults.name);
  answers.displayName = await q("Nombre para mostrar", answers.name);
  answers.description = await q("Descripción en una línea", defaults.description);

  let pm = await q(`Gestor de paquetes (${PACKAGE_MANAGERS.join("/")})`, defaults.packageManager);
  while (!PACKAGE_MANAGERS.includes(pm)) pm = await q(`No reconocido. Elige uno de ${PACKAGE_MANAGERS.join("/")}`, "pnpm");
  answers.packageManager = pm;

  answers.port = await q("Puerto por defecto", defaults.port);
  answers.keepExamples = /^(s|si|sí|y|yes)?$/i.test(await q("¿Conservar examples/? (s/n)", "s"));
  rl.close();
  return answers;
}

// ── Construcción del plan ────────────────────────────────────────────────────
function buildPlan(a) {
  const cmds = commandsFor(a.packageManager);
  const rev = templateRevision();

  op(`harness.config.json — project.* y comandos de ${a.packageManager}`, () => {
    const c = readJson("harness.config.json");
    c.project.name = a.name;
    c.project.displayName = a.displayName;
    c.project.description = a.description || `Proyecto ${a.displayName}.`;
    c.stack.packageManager = a.packageManager;
    c.commands = { ...c.commands, ...cmds };
    writeJson("harness.config.json", c);
  });

  op(`package.json — nombre, descripción y scripts de ${a.packageManager}`, () => {
    const p = readJson("package.json");
    p.name = a.name;
    p.version = "0.1.0";
    p.description = a.description || `Proyecto ${a.displayName}.`;
    p.keywords = [];
    if (a.packageManager === "pnpm") {
      p.packageManager = p.packageManager ?? "pnpm@11.21.0";
    } else {
      delete p.packageManager;
    }
    const run = a.packageManager === "npm" ? "npm run" : a.packageManager;
    p.scripts.start = `${run} build && node dist/app.js`;
    p.scripts["test:example"] = `cd examples/auth-mongo && ${a.packageManager} test`;
    p.scripts["typecheck:example"] = `cd examples/auth-mongo && ${a.packageManager} typecheck`;
    if (!a.keepExamples) {
      delete p.scripts["test:example"];
      delete p.scripts["typecheck:example"];
    }
    writeJson("package.json", p);
  });

  op("feature_list.json — project/description; se retira la feature semilla", () => {
    const f = readJson("feature_list.json");
    f.project = a.name;
    f.description = a.description || `Proyecto ${a.displayName}.`;
    f.features = [];
    writeJson("feature_list.json", f);
  });

  op(`src/.env.template — PORT y APP_NAME`, () => {
    writeFileSync("src/.env.template", `PORT=\nAPP_NAME=\n`);
  });

  op(`src/.env — PORT=${a.port} y APP_NAME=${a.name}`, () => {
    // Si ya existe (p. ej. heredado de la copia del template), se actualizan solo
    // esas dos líneas y se conserva todo lo demás: puede llevar secretos reales.
    if (!existsSync("src/.env")) {
      writeFileSync("src/.env", `PORT=${a.port}\nAPP_NAME=${a.name}\n`);
      return;
    }
    let env = readFileSync("src/.env", "utf8");
    const upsert = (key, value) => {
      const re = new RegExp(`^${key}=.*$`, "m");
      env = re.test(env) ? env.replace(re, `${key}=${value}`) : env.replace(/\n*$/, `\n${key}=${value}\n`);
    };
    upsert("PORT", a.port);
    upsert("APP_NAME", a.name);
    writeFileSync("src/.env", env);
  });

  op(`request/get-health.rest — puerto ${a.port}`, () => {
    const f = "request/get-health.rest";
    if (!existsSync(f)) return;
    writeFileSync(f, readFileSync(f, "utf8").replace(/^@portDev = .*/m, `@portDev = ${a.port}`));
  });

  op("docs/project/overview.md — se regenera para este proyecto", () => {
    writeFileSync("docs/project/overview.md", overviewFor(a, cmds));
  });

  op("docs/api/openapi.yaml — se regenera con info.title/servers de este proyecto", () => {
    writeFileSync("docs/api/openapi.yaml", contractFor(a));
  });

  op("README.md — se sustituye por el readme del proyecto", () => {
    writeFileSync("README.md", readmeFor(a, cmds));
  });

  op("progress/current.md — se restaura desde la plantilla", () => {
    copyFileSync(".claude/harness/templates/progress-current.md", "progress/current.md");
  });

  op(`progress/history.md — se resetea con la procedencia del template (@ ${rev})`, () => {
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync("progress/history.md",
`# Bitácora histórica (append-only)

> Cada vez que se cierra una sesión, su resumen se añade aquí.
> No edites entradas anteriores. Solo añades al final.

---

## ${today} — Proyecto creado desde el template
- **Template:** node-clean-architect-template @ \`${rev}\`
- **Scaffold:** nombre \`${a.name}\`, gestor \`${a.packageManager}\`, puerto ${a.port}, examples/ ${a.keepExamples ? "conservado" : "eliminado"}.
- **Verificación:** \`./init.sh\` en verde tras el scaffold.
`);
  });

  op("specs/ y docs/ideas/ — se vacían (se conserva el .gitkeep)", () => {
    for (const dir of ["specs", "docs/ideas"]) {
      if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
      for (const entry of readdirSync(dir)) {
        if (entry === ".gitkeep") continue;
        rmSync(join(dir, entry), { recursive: true, force: true });
      }
      if (!existsSync(join(dir, ".gitkeep"))) writeFileSync(join(dir, ".gitkeep"), "");
    }
  });

  if (!a.keepExamples) {
    op("examples/ — se elimina", () => rmSync("examples", { recursive: true, force: true }));
  }

  op(`${MARKER} — marca de scaffold (guard de re-corrida)`, () => {
    mkdirSync(".harness", { recursive: true });
    writeJson(MARKER, { scaffoldedAt: new Date().toISOString(), templateRevision: rev, answers: a });
  });
}

// ── Contenido generado ───────────────────────────────────────────────────────
const overviewFor = (a, c) => `## Proyecto

${a.description || `Proyecto ${a.displayName}.`}

API REST con Node.js + TypeScript y Express 5, estructurada como Clean Architecture
estricta (\`presentation\` → \`infrastructure\` → \`domain\`, dependencias siempre hacia
adentro). Los comandos y los nombres de capa están en \`harness.config.json\`.

## Comandos

\`\`\`bash
${c.install}
cp src/.env.template src/.env      # luego rellena PORT y APP_NAME
${c.dev}                           # servidor de desarrollo con recarga
${c.test}                          # suite de la capa interna, sin I/O
${c.typecheck}                     # typecheck (incluye los archivos de test)
${c.build}                         # build a dist/
./init.sh                          # verificación completa del arnés
\`\`\`

La suite de la capa interna corre **sin base de datos, sin servidor y sin variables de
entorno**: importar cualquier cosa bajo la capa interna nunca toca \`config/\`. Requiere
Node.js 20+.

Las pruebas manuales de la API viven en \`request/*.rest\` (formato REST Client).

## Endpoints

| Método | Ruta | Auth | Handler |
|---|---|---|---|
| GET | \`/api/health\` | No | \`HealthController.getHealth\` |

Sustituye esta tabla por los endpoints de tu proyecto. \`/api/health\` viene del esqueleto
del template: bórralo cuando ya no te sirva de referencia.
`;

const contractFor = (a) => `openapi: 3.1.0
info:
  title: ${a.displayName}
  description: |
    ${a.description || `API REST de ${a.displayName}.`}

    Contrato API-first: fuente de verdad de la superficie HTTP, verificada contra las
    rutas realmente montadas por \`scripts/check-api-contract.mjs\` (checkpoint C11 de
    CHECKPOINTS.md). Metodología: \`docs/api-design.md\`.
  version: "0.1.0"
servers:
  - url: http://localhost:${a.port}
    description: Desarrollo local (puerto de \`src/.env\`, ver PORT)

tags:
  - name: Health
    description: Estado del servicio

paths:
  /api/health:
    get:
      operationId: getHealth
      summary: Estado del servicio
      tags: [Health]
      x-feature: health
      x-status: live
      parameters:
        - name: verbose
          in: query
          required: false
          schema:
            type: string
            enum: ["true", "false"]
      responses:
        "200":
          description: Servicio saludable.
          content:
            application/json:
              schema:
                oneOf:
                  - $ref: "#/components/schemas/PublicHealth"
                  - $ref: "#/components/schemas/PublicHealthVerbose"
        "400":
          $ref: "#/components/responses/BadRequest"

components:
  schemas:
    PublicHealth:
      type: object
      required: [status, appName]
      properties:
        status: { type: string, const: ok }
        appName: { type: string }
      additionalProperties: false

    PublicHealthVerbose:
      allOf:
        - $ref: "#/components/schemas/PublicHealth"
        - type: object
          required: [uptimeSeconds, nodeVersion, checkedAt]
          properties:
            uptimeSeconds: { type: number }
            nodeVersion: { type: string }
            checkedAt: { type: string, format: date-time }
          additionalProperties: false

    Error:
      type: object
      required: [error]
      properties:
        error: { type: string }
      additionalProperties: false

  responses:
    BadRequest:
      description: Request inválido.
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
          example:
            error: 'verbose debe ser "true" o "false"'
`;

const readmeFor = (a, c) => `# ${a.displayName}

${a.description || ""}

API REST con Node.js + TypeScript y Express 5, sobre Clean Architecture estricta y con un
arnés de Spec Driven Development multiagente.

## Empezar

\`\`\`bash
${c.install}
cp src/.env.template src/.env      # rellena PORT y APP_NAME
./init.sh                          # verificación completa
${c.dev}
\`\`\`

## Flujo de trabajo

Las features nuevas pasan por el arnés SDD, con una puerta de aprobación humana antes de
que se escriba código:

\`\`\`
idea → /brainstorm o /add-feature → pending
     → /implement-next → spec_ready → ⏸ apruebas → in_progress → done
\`\`\`

La guía completa está en [\`docs/workflow.md\`](docs/workflow.md).

## Documentación

| Si quieres… | Lee |
|---|---|
| Usar el arnés de principio a fin | [\`docs/workflow.md\`](docs/workflow.md) |
| Entender la arquitectura | [\`docs/architecture.md\`](docs/architecture.md) |
| Aprender el patrón línea a línea sobre el esqueleto de este proyecto | [\`CLEAN_ARCHITECTURE.md\`](CLEAN_ARCHITECTURE.md) |
| Las convenciones de código | [\`docs/conventions.md\`](docs/conventions.md) |
| Escribir o leer un spec | [\`docs/specs.md\`](docs/specs.md) |
| Cómo se demuestra que algo funciona | [\`docs/verification.md\`](docs/verification.md) |
| Los criterios de review | [\`CHECKPOINTS.md\`](CHECKPOINTS.md) |
| Lo específico de este proyecto | [\`docs/project/\`](docs/project/) |

## Requisitos

Node.js 20+ y ${a.packageManager}.
`;

// ── Ejecución ────────────────────────────────────────────────────────────────
function runInit() {
  try {
    execFileSync("./init.sh", { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function gitCommit(a) {
  const isRepo = existsSync(".git");
  try {
    if (!isRepo) execFileSync("git", ["init", "-q", "-b", "main"], { stdio: "inherit" });
    execFileSync("git", ["add", "-A"], { stdio: "inherit" });
    execFileSync("git", ["commit", "-q", "-m",
      `chore: proyecto ${a.name} creado desde node-clean-architect-template`], { stdio: "inherit" });
    console.log(isRepo ? "  git: commit del scaffold creado" : "  git: repositorio inicializado y primer commit creado");
  } catch {
    console.log("  git: no se pudo commitear (¿nada que commitear, o falta configurar user.name?). Hazlo a mano.");
  }
}

async function main() {
  if (existsSync(MARKER) && !FORCE) {
    const m = readJson(MARKER);
    console.error(`\nEste proyecto ya se scaffoldeó (${m.scaffoldedAt}).`);
    console.error(`Si de verdad quieres re-correrlo: node scripts/scaffold.mjs --apply --force\n`);
    process.exit(1);
  }

  const answers = await ask();
  buildPlan(answers);

  console.log("\n── Plan ───────────────────────────────────────────────");
  for (const { label } of plan) console.log(`  · ${label}`);
  console.log("──────────────────────────────────────────────────────");

  if (!APPLY) {
    console.log("\nDRY-RUN: no se ha tocado nada.");
    console.log("Para aplicarlo:  node scripts/scaffold.mjs --apply\n");
    return;
  }

  console.log("");
  for (const { label, fn } of plan) {
    fn();
    console.log(`  ✔ ${label}`);
  }

  console.log("\n── Verificación ───────────────────────────────────────\n");
  if (!runInit()) {
    console.error("\n./init.sh ha fallado. El scaffold SÍ se aplicó; revisa la salida de arriba.");
    console.error("Para volver al estado anterior:  git checkout .\n");
    process.exit(1);
  }

  if (!NO_GIT) {
    console.log("");
    gitCommit(answers);
  }

  console.log(`\nListo. Proyecto '${answers.name}' en verde.`);
  console.log(`Siguiente paso: /brainstorm (idea vaga) o /add-feature (idea clara).\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
