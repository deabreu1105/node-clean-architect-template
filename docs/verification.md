# Verificación — Cómo demostrar que el trabajo funciona

> Regla de oro: **el agente no dice "funciona", lo demuestra**.
> Toda feature termina con evidencia ejecutable, no con afirmaciones.

## Niveles de verificación

### Nivel 1 — Tests de la capa interna (obligatorio)

Todo DTO y todo use-case público de la capa interna tiene al menos un test
colocado (junto al archivo que prueba) que:

1. Cubre el camino feliz.
2. Cubre al menos un camino de error si la pieza puede fallar.

Estos tests **no tocan la base de datos, no leen `.env` y no levantan el
servidor**. Usan fakes tipados contra los puertos de la capa interna
(`HealthRepository`, `Clock` en este esqueleto; los de tu proyecto están en
`docs/project/architecture.md § Puertos`) — nunca la implementación real.

Comando: `commands.test` de `harness.config.json`.
```bash
pnpm test
```

### Nivel 2 — Typecheck + guard de la Regla de Dependencia (obligatorio)

Toda feature que toque tipos, firmas o imports debe compilar sin errores y
sin haber introducido un import prohibido desde la capa interna:

```bash
pnpm typecheck          # commands.typecheck
./scripts/check-dependency-rule.sh
# el guard debe salir 0 — ver checkpoint C2 de CHECKPOINTS.md
```

El guard construye lo que está prohibido a partir de `harness.config.json`
(`layers.outer` + `layers.bannedInInner`). Para ver el detalle:
`node scripts/lib/dep-rule-pattern.mjs --explain`.

Si el proyecto declara `harness.api` (features con `"api": true`), añade el guard del
contrato:

```bash
pnpm exec tsx scripts/check-api-contract.mjs    # commands.apicheck
# exit 0 esperado — ver checkpoint C11
```

### Nivel 3 — Smoke test manual vía HTTP (obligatorio para features de API)

Las features que añaden o cambian un endpoint se verifican levantando el
servidor real y golpeándolo, no solo con tests de dominio. Dos formas:

- **`request/*.rest`** (formato REST Client): añade o edita el archivo
  correspondiente (`request/get-health.rest`, o uno nuevo para el endpoint
  que estés añadiendo) y ejecútalo contra `pnpm dev`. Si la feature es
  `"api": true`, deriva cada caso de los `examples` de su operación en
  `docs/api/openapi.yaml` — el contrato ya tiene el camino feliz y al menos
  un caso de error documentados; el `.rest` es esos mismos casos contra el
  servidor real.
- **`curl`** contra el servidor de desarrollo:
  ```bash
  pnpm dev &
  sleep 2
  curl -s "http://localhost:$PORT/api/health"
  curl -s "http://localhost:$PORT/api/health?verbose=true"
  curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:$PORT/api/health?verbose=x"
  ```
  (usa el `PORT` de `src/.env`). Si tu feature necesita infraestructura viva
  — una base de datos, una API externa — este es el nivel donde se levanta;
  documenta en `progress/impl_<name>.md` qué hacía falta y qué respondió.

### Nivel 4 — Trazabilidad de requirements (obligatorio para features con `"sdd": true`)

Cada `R<n>` de `specs/<name>/requirements.md` debe poder mapearse a al
menos un test concreto, o — si el requirement exige I/O real y no es
testeable de forma aislada — a una verificación manual documentada
explícitamente (Nivel 3). El reviewer rechaza si un `R<n>`
queda sin ninguna de las dos cosas.

El implementer documenta el mapa en `progress/impl_<name>.md`:

```markdown
## Trazabilidad
- R1 → `test "GetHealth composes the entity from the repository snapshot"`
- R2 → `test "HealthQueryDto.create rejects a non-boolean value without throwing"`
- R3 → verificación manual: `request/get-health.rest` contra `pnpm dev`
```

## Anti-patrones (no hacer)

- ❌ "He añadido el endpoint, debería funcionar." → falta test ejecutable.
- ❌ Test que solo verifica que la función no lanza excepción. → tiene que
  comprobar el resultado concreto (`assert.deepEqual`, no solo
  `assert.doesNotThrow`).
- ❌ Mockear la librería concreta o hacer un fake a medias del puerto. → si
  necesitas probar un use-case, usa un fake completo del contrato abstracto
  de la capa interna, no de la implementación ni de la librería.
- ❌ Comprobar la entidad interna cruda en un test de contrato como si fuera
  lo que sale por la red — el test debe comprobar el método de proyección
  pública, igual que hace el código real.
- ❌ Marcar la feature como `done` sin pasar `./init.sh`.

## Verificación final antes de cerrar

```bash
./init.sh           # debe terminar con [OK] Entorno listo
```

Si `./init.sh` está rojo, **no** marques nada como `done`. Anota el bloqueo
en `progress/current.md` y pon `blocked` en `feature_list.json`.
