// Guard del contrato API — checkpoint C11 de CHECKPOINTS.md.
//
// El contrato OpenAPI (harness.api.contract, por defecto docs/api/openapi.yaml) es la
// fuente de verdad de la superficie HTTP. Este script comprueba dos niveles:
//
//   N1 — El contrato es válido en sí mismo: OpenAPI 3.1, $ref internos resueltos,
//        operationId únicos, y toda operación trae x-feature + x-status.
//   N2 — No hay deriva entre el contrato y el código: las rutas REALMENTE montadas en
//        harness.api.routerFactory (por defecto AppRoutes.routes de
//        src/presentation/routes.ts) coinciden exactamente con las operaciones
//        x-status: live del contrato.
//
// Por qué N2 se hace importando el módulo real (no grep sobre el archivo): un grep sobre
// routes.ts da falsa confianza — no compone el prefijo de AppRoutes con el sufijo del
// sub-router, y no detecta una ruta montada condicionalmente. En vez de eso, se
// monkey-patchea `express.Router` ANTES de importar el módulo de rutas, se invoca la
// factory con puertos inertes (proxies que nunca ejecutan lógica si se llaman: el wiring
// de rutas nunca debe invocar un puerto, solo pasarlo por parámetro) y se recorre el
// árbol de routers real para componer los paths completos.
//
// Detalle técnico: `require('express')` y el `import()` dinámico de un módulo TS que hace
// `import { Router } from 'express'` resuelven al MISMO módulo cacheado de Node (misma
// ruta de archivo). Los named exports de un paquete CJS interoperado por ESM son getters
// que leen `module.exports.<nombre>` en cada acceso, así que parchear `express.Router`
// antes de invocar la factory basta — no hace falta parchear antes del `import()`.
//
// Uso:  pnpm exec tsx scripts/check-api-contract.mjs   (o: pnpm run api:check)
// Sale: 0 si no hay hallazgos (con o sin warnings) · 1 si hay errores

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve as resolvePath, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const require = createRequire(import.meta.url);

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[0;33m";
const NC = "\x1b[0m";
const ok = (msg) => console.log(`${GREEN}[OK]${NC}    ${msg}`);
const warn = (msg) => console.log(`${YELLOW}[WARN]${NC}  ${msg}`);
const fail = (msg) => console.log(`${RED}[FAIL]${NC}  ${msg}`);

const configFile = process.env.HARNESS_CONFIG ?? "harness.config.json";

let cfg;
try {
  cfg = JSON.parse(readFileSync(configFile, "utf8"));
} catch (e) {
  fail(`${configFile} ilegible o JSON inválido: ${e.message}`);
  process.exit(1);
}

const apiCfg = cfg?.harness?.api ?? {};
const contractPath = apiCfg.contract ?? "docs/api/openapi.yaml";
const routerFactoryCfg = apiCfg.routerFactory ?? {
  module: "src/presentation/routes.ts",
  export: "AppRoutes",
  method: "routes",
};
const statusesRequiringContract = new Set(
  apiCfg.statusesRequiringContract ?? ["contract_ready", "spec_ready", "in_progress", "done"],
);

const featureListFile = cfg?.harness?.featureList ?? "feature_list.json";

let errors = [];
let warnings = [];

// ── Features que declaran superficie HTTP ───────────────────────────────────
let features = [];
if (existsSync(featureListFile)) {
  try {
    const data = JSON.parse(readFileSync(featureListFile, "utf8"));
    features = Array.isArray(data.features) ? data.features : [];
  } catch (e) {
    fail(`${featureListFile} ilegible o JSON inválido: ${e.message}`);
    process.exit(1);
  }
}
const apiFeatures = features.filter((f) => f?.api === true);
const featuresRequiringContract = apiFeatures.filter((f) =>
  statusesRequiringContract.has(f?.status),
);
const featureNames = new Set(features.map((f) => f?.name).filter(Boolean));

// ── Sin contrato: solo es FAIL si alguna feature lo exige ──────────────────
if (!existsSync(contractPath)) {
  if (featuresRequiringContract.length === 0) {
    ok(`No existe ${contractPath} — ninguna feature con "api": true lo requiere todavía`);
    process.exit(0);
  }
  fail(
    `Falta ${contractPath}, pero ${featuresRequiringContract.length} feature(s) con ` +
      `"api": true lo requieren: ${featuresRequiringContract.map((f) => f.name).join(", ")}`,
  );
  process.exit(1);
}

// ── N1a: parseo YAML + versión OpenAPI ──────────────────────────────────────
let doc;
try {
  doc = parseYaml(readFileSync(contractPath, "utf8"));
} catch (e) {
  fail(`${contractPath} no es YAML válido: ${e.message}`);
  process.exit(1);
}

if (doc === null || typeof doc !== "object") {
  fail(`${contractPath} no contiene un documento OpenAPI (YAML vacío o escalar)`);
  process.exit(1);
}

if (typeof doc.openapi !== "string" || !doc.openapi.startsWith("3.1")) {
  errors.push(`'openapi' debe ser "3.1.x" (encontrado: ${JSON.stringify(doc.openapi)})`);
}

// ── N1b: $ref internos resuelven ────────────────────────────────────────────
function resolveInternalRef(ref) {
  if (!ref.startsWith("#/")) return { external: true };
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let node = doc;
  for (const part of parts) {
    if (node == null || typeof node !== "object" || !(part in node)) {
      return { resolved: false };
    }
    node = node[part];
  }
  return { resolved: true, node };
}

function walkRefs(node, path, visit) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => walkRefs(item, `${path}[${i}]`, visit));
    return;
  }
  if (typeof node.$ref === "string") {
    visit(node.$ref, path);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref") continue;
    walkRefs(value, `${path}.${key}`, visit);
  }
}

walkRefs(doc, "$", (ref, path) => {
  const result = resolveInternalRef(ref);
  if (result.external) {
    errors.push(`${path}: $ref externo no permitido: '${ref}' (solo #/... interno)`);
  } else if (!result.resolved) {
    errors.push(`${path}: $ref no resuelve: '${ref}'`);
  }
});

// ── N1c: recorrer operaciones — operationId único, x-feature, x-status ─────
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
const operations = []; // { method, path, operationId, xFeature, xStatus }
const seenOperationIds = new Map();

for (const [routePath, pathItem] of Object.entries(doc.paths ?? {})) {
  if (pathItem === null || typeof pathItem !== "object") continue;
  for (const method of HTTP_METHODS) {
    const op = pathItem[method];
    if (op === undefined) continue;
    if (op === null || typeof op !== "object") {
      errors.push(`paths.${routePath}.${method}: la operación debe ser un objeto`);
      continue;
    }

    const at = `paths.${routePath}.${method}`;

    if (typeof op.operationId !== "string" || op.operationId.trim() === "") {
      errors.push(`${at}: falta 'operationId'`);
    } else if (seenOperationIds.has(op.operationId)) {
      errors.push(
        `${at}: operationId '${op.operationId}' duplicado (ya lo usa ${seenOperationIds.get(op.operationId)})`,
      );
    } else {
      seenOperationIds.set(op.operationId, at);
    }

    if (typeof op["x-feature"] !== "string" || op["x-feature"].trim() === "") {
      errors.push(`${at}: falta 'x-feature'`);
    } else if (featureNames.size > 0 && !featureNames.has(op["x-feature"])) {
      warnings.push(
        `${at}: x-feature '${op["x-feature"]}' no existe en ${featureListFile} (huérfano)`,
      );
    }

    if (op["x-status"] !== "live" && op["x-status"] !== "planned") {
      errors.push(`${at}: 'x-status' debe ser 'live' o 'planned' (encontrado: ${JSON.stringify(op["x-status"])})`);
    }

    operations.push({
      method: method.toUpperCase(),
      path: routePath,
      operationId: op.operationId,
      xFeature: op["x-feature"],
      xStatus: op["x-status"],
    });
  }
}

// ── N1d: toda feature "api": true que lo requiere tiene ≥1 operación propia ─
for (const f of featuresRequiringContract) {
  const owns = operations.some((o) => o.xFeature === f.name);
  if (!owns) {
    errors.push(
      `Feature '${f.name}' tiene "api": true y status '${f.status}', pero ninguna ` +
        `operación de ${contractPath} declara x-feature: ${f.name}`,
    );
  }
}

if (errors.length > 0) {
  for (const w of warnings) warn(w);
  for (const e of errors) fail(e);
  process.exit(1);
}

ok(`${contractPath} es OpenAPI 3.1 válido`);
ok(`${operations.length} operationId únicos · $ref internos resueltos`);

// ── N2: rutas realmente montadas vs. operaciones live del contrato ─────────

function makeInertPort() {
  const target = function inertPort() {};
  const handler = {
    get(_t, prop) {
      if (prop === "then" || prop === "constructor" || typeof prop === "symbol") {
        return undefined;
      }
      return makeInertPort();
    },
    apply() {
      return makeInertPort();
    },
  };
  return new Proxy(target, handler);
}

function joinPath(prefix, suffix) {
  const a = prefix.replace(/\/+$/, "");
  const b = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const joined = `${a}${b}`.replace(/\/{2,}/g, "/");
  if (joined === "") return "/";
  // Normaliza el trailing slash: express monta '/' como sufijo de un sub-router para
  // decir "la raíz de este recurso", pero el path completo en el contrato nunca lo lleva
  // (salvo que la ruta completa SEA la raíz '/').
  if (joined.length > 1 && joined.endsWith("/")) return joined.slice(0, -1);
  return joined;
}

async function collectMountedRoutes() {
  const modulePath = resolvePath(routerFactoryCfg.module);
  if (!existsSync(modulePath)) {
    return { error: `No existe ${routerFactoryCfg.module} (harness.api.routerFactory.module)` };
  }

  const express = require("express");
  const originalRouterFactory = express.Router;
  const patchedRouters = new WeakSet();

  express.Router = function patchedRouter(...args) {
    const router = originalRouterFactory.apply(this, args);
    const routes = [];
    const mounts = [];

    for (const method of HTTP_METHODS) {
      const original = router[method];
      if (typeof original !== "function") continue;
      router[method] = function (path, ...handlers) {
        if (typeof path === "string") routes.push({ method: method.toUpperCase(), path });
        return original.apply(this, [path, ...handlers]);
      };
    }

    const originalUse = router.use;
    router.use = function (...useArgs) {
      if (typeof useArgs[0] === "string") {
        mounts.push({ prefix: useArgs[0], targets: useArgs.slice(1) });
      }
      return originalUse.apply(this, useArgs);
    };

    patchedRouters.add(router);
    router.__harnessRoutes = routes;
    router.__harnessMounts = mounts;
    return router;
  };

  let rootRouter;
  try {
    const moduleUrl = pathToFileURL(modulePath).href;
    const imported = await import(moduleUrl);
    const exported = imported[routerFactoryCfg.export];
    if (!exported || typeof exported[routerFactoryCfg.method] !== "function") {
      return {
        error:
          `${routerFactoryCfg.module} no exporta ${routerFactoryCfg.export}.${routerFactoryCfg.method}() ` +
          `(harness.api.routerFactory)`,
      };
    }
    const inertPorts = Array.from({ length: 8 }, () => makeInertPort());
    rootRouter = exported[routerFactoryCfg.method](...inertPorts);
  } catch (e) {
    return { error: `No se pudo importar/invocar la factory de rutas: ${e.message}` };
  } finally {
    express.Router = originalRouterFactory;
  }

  if (!patchedRouters.has(rootRouter)) {
    return {
      error:
        `${routerFactoryCfg.export}.${routerFactoryCfg.method}() no devolvió un Router ` +
        `de express — no se pudo instrumentar`,
    };
  }

  const mountedRoutes = [];
  function walk(router, prefix) {
    for (const r of router.__harnessRoutes ?? []) {
      mountedRoutes.push({ method: r.method, path: joinPath(prefix, r.path) });
    }
    for (const m of router.__harnessMounts ?? []) {
      for (const target of m.targets) {
        if (patchedRouters.has(target)) {
          walk(target, joinPath(prefix, m.prefix));
        }
        // Middleware que no es un router instrumentado (p. ej. express.json()) — se
        // ignora: no aporta rutas.
      }
    }
  }
  walk(rootRouter, "");

  return { routes: mountedRoutes };
}

const mounted = await collectMountedRoutes();

if (mounted.error) {
  fail(`N2 (deriva código↔contrato): ${mounted.error}`);
  for (const w of warnings) warn(w);
  process.exit(1);
}

const mountedKey = (r) => `${r.method} ${r.path}`;
const mountedSet = new Map(mounted.routes.map((r) => [mountedKey(r), r]));
const liveOps = operations.filter((o) => o.xStatus === "live");
const liveOpByKey = new Map(liveOps.map((o) => [`${o.method} ${o.path}`, o]));

const n2Errors = [];

for (const r of mounted.routes) {
  const key = mountedKey(r);
  const op = operations.find((o) => `${o.method} ${o.path}` === key);
  if (!op) {
    n2Errors.push(`${key} está montada en el código pero no existe en ${contractPath}`);
  } else if (op.xStatus !== "live") {
    n2Errors.push(
      `${key} está montada en el código pero su operación '${op.operationId}' sigue en ` +
        `x-status: planned — flipa a 'live' al implementarla`,
    );
  }
}

for (const op of liveOps) {
  const key = `${op.method} ${op.path}`;
  if (!mountedSet.has(key)) {
    n2Errors.push(
      `Operación '${op.operationId}' (${key}) está x-status: live en el contrato pero ` +
        `no hay ninguna ruta montada para ella`,
    );
  }
}

if (n2Errors.length > 0) {
  for (const w of warnings) warn(w);
  for (const e of n2Errors) fail(e);
  process.exit(1);
}

for (const w of warnings) warn(w);
ok(`Rutas montadas (${mounted.routes.length}) == operaciones live del contrato (${liveOps.length})`);
process.exit(0);
