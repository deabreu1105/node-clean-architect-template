# Plantilla Clean Architecture + arnés SDD (Node + TypeScript)

Template para arrancar proyectos backend con **Clean Architecture estricta** y un **arnés
de Spec Driven Development multiagente** ya montado: 6 subagentes, 8 slash commands, reglas
de arquitectura verificadas por script (incluido el contrato API-first) y hasta tres
puertas de aprobación humana antes de que se escriba una línea de código.

No es un boilerplate de código. Lo que aporta es el **proceso verificable** que va encima.

## Crear un proyecto nuevo

```bash
# 1. Copia el template — si ya está publicado en GitHub (elige una)
gh repo create mi-api --template <usuario>/node-clean-architect-template --private --clone
npx degit <usuario>/node-clean-architect-template mi-api

# 1 (alternativa). Si el template solo existe en local (todavía no está en GitHub):
# copia el árbol de archivos tal cual está ahora mismo (incluidos cambios sin
# commitear) y arranca sin ningún historial de git, en limpio.
rsync -a --exclude='.git' --exclude='node_modules' /ruta/a/node-clean-architect-template/ mi-api/
git -C mi-api init -q -b main

# 2. Instálalo y scaffoldéalo
cd mi-api
pnpm install
node scripts/scaffold.mjs             # dry-run: enseña el plan, no toca nada
node scripts/scaffold.mjs --apply     # lo aplica, resetea el arnés y corre ./init.sh
```

La alternativa local usa `rsync` en vez de `git clone` a propósito: `git clone` solo trae
lo que ya está commiteado, así que un cambio del template todavía sin commitear no llegaría
a `mi-api`. `rsync` copia el árbol de trabajo real, sin `.git/` (nada de historial previo)
ni `node_modules/` (se reinstala en el paso 2). `git init -q -b main` deja el proyecto
nuevo con un repositorio propio y vacío, listo para su primer commit.

El scaffold pregunta nombre, descripción, gestor de paquetes y puerto; reescribe
`package.json`, `harness.config.json`, `feature_list.json`, `CLAUDE.md` y el
`.env.template`; resetea `progress/`, `specs/` y `docs/ideas/`; y te ofrece borrar
`examples/`. Termina corriendo `./init.sh`, así sabes que arrancas en verde.

## Qué trae

**El esqueleto** — `src/` con las tres capas y una sola ruta de ejemplo,
`GET /api/health?verbose=true`, que demuestra el patrón completo: DTO que no lanza, puerto
inyectado, la capa externa como único sitio que lee la configuración, y una frontera de
proyección hacia el cliente. Cinco tests, sin base de datos ni `.env`.

**El arnés SDD** — el flujo `pending → [contract_ready] → spec_ready → ⏸ humano →
in_progress → done`, con `leader`, `ideator`, `api_designer`, `spec_author`,
`implementer` y `reviewer` en `.claude/agents/`, y los comandos `/brainstorm`,
`/add-feature`, `/design-api`, `/approve-contract`, `/implement-next`, `/approve-spec`,
`/run-review` y `/close-session`.

**API-first** — toda feature que expone HTTP (`"api": true`) diseña y aprueba su
contrato OpenAPI en `docs/api/openapi.yaml` **antes** de que exista su spec. Ver
[`docs/api-design.md`](docs/api-design.md).

**Verificación que no se puede saltar** — `./init.sh` comprueba el entorno, los archivos
base, la validez de `feature_list.json` y sus specs, la Regla de Dependencia, el contrato
API sin deriva, el typecheck y la suite. Ninguna feature se marca `done` sin que esté en
verde.

**Reglas que se activan solas** — `.claude/rules/` lleva reglas cortas con `paths:` scope,
así que la de la capa interna aparece justo cuando se edita la capa interna, y no antes.

**Material de referencia** — `examples/` trae una API de autenticación completa construida
con esta arquitectura (con un recorrido línea a línea de su código, incluidos cinco bugs
de arquitectura reales y cómo se arreglaron) y ciclos SDD terminados de verdad.

## Cómo se configura

Todo lo específico del stack vive en un solo archivo, **`harness.config.json`**: gestor de
paquetes, comandos, raíz del código, nombre de la capa interna, capas externas, paquetes
vetados dentro de la capa interna y archivos obligatorios. `init.sh` y los scripts de
`scripts/` leen de ahí, así que no hay que editarlos por proyecto.

## Por dónde empezar a leer

| Si quieres… | Lee |
|---|---|
| Entender cómo funciona y por qué está montado así | [`docs/como-funciona.md`](docs/como-funciona.md) |
| Usar el arnés de principio a fin | [`docs/workflow.md`](docs/workflow.md) |
| Entender la arquitectura | [`docs/architecture.md`](docs/architecture.md) |
| Aprender el patrón línea a línea sobre el esqueleto de este template | [`CLEAN_ARCHITECTURE.md`](CLEAN_ARCHITECTURE.md) |
| Diseñar el contrato de una API (metodología API-first) | [`docs/api-design.md`](docs/api-design.md) |
| Escribir o leer un spec | [`docs/specs.md`](docs/specs.md) |
| Saber cómo se demuestra que algo funciona | [`docs/verification.md`](docs/verification.md) |
| Ver los criterios con los que revisa el `reviewer` | [`CHECKPOINTS.md`](CHECKPOINTS.md) |
| Ver la arquitectura aplicada a un sistema entero, con un caso de estudio de bugs reales | [`examples/auth-mongo/CLEAN_ARCHITECTURE.md`](examples/auth-mongo/CLEAN_ARCHITECTURE.md) |

`CLAUDE.md` es el punto de entrada para los agentes: importa la mitad de arnés
(`.claude/harness/`) y la mitad de proyecto (`docs/project/`).

## Requisitos

Node.js 20+ y pnpm (o npm/yarn: el scaffold ajusta los comandos).

## Idioma

El arnés está íntegramente en español — documentación, agentes, comandos y salida de
`init.sh`. Los nombres de test van en inglés, como frase.
