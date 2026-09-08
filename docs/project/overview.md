## Proyecto

Esqueleto de API REST con Node.js + TypeScript y Express 5, estructurado como Clean
Architecture estricta (`presentation` → `infrastructure` → `domain`, dependencias siempre
hacia adentro). Trae una única ruta de ejemplo, `GET /api/health`, que demuestra las tres
capas de punta a punta. El gestor de paquetes y los comandos están en
`harness.config.json`.

> **Este archivo lo rellena `scripts/scaffold.mjs` al crear un proyecto nuevo.** Reescribe
> esta sección con lo que hace *tu* proyecto y borra lo que sobre del ejemplo.

## Comandos

```bash
pnpm install                       # instala dependencias
cp src/.env.template src/.env      # luego rellena PORT y APP_NAME
pnpm dev                           # servidor de desarrollo con recarga (tsx watch)
pnpm test                          # node:test vía tsx, corre src/**/*.test.ts
pnpm typecheck                     # solo typecheck (incluye los archivos de test)
pnpm build                         # rimraf dist + tsc -p tsconfig.build.json
pnpm start                         # build y luego node dist/app.js
./init.sh                          # verificación completa del arnés
```

No hay linter configurado. `pnpm test` corre la suite de la capa interna con
`node:test`/`node:assert`: **sin base de datos, sin Express arrancado y sin variables de
entorno**. Eso está garantizado por construcción — importar cualquier cosa bajo `domain/`
nunca toca `config/`. Requiere Node.js 20+.

Las pruebas manuales de la API viven en `request/*.rest` (formato REST Client).

Para verificar el ejemplo archivado: `pnpm test:example` (necesita su propio
`pnpm install`, ver `examples/auth-mongo/README.md`).

## Endpoints

| Método | Ruta | Auth | Handler |
|---|---|---|---|
| GET | `/api/health` | No | `HealthController.getHealth` |

`?verbose=true` añade `uptimeSeconds`, `nodeVersion` y `checkedAt`. Un valor que no sea
`true` ni `false` responde `400` sin lanzar.
