---
id: SEC-001
severity: Medium         # Critical | High | Medium | Low
confidence: High         # High | Medium
status: feature          # open | feature | fixed | accepted_risk | false_positive
cwe: CWE-1035            # Uso de componente con vulnerabilidades conocidas (+ CWE-400 DoS)
audit: 2026-09-15
feature: sec_001_qs_dos_dependencia_vulnerable
---

# SEC-001 — Dependencia transitiva `qs@6.15.3` vulnerable a Denegación de Servicio

## Ubicación

- `package.json:38` — `"express": "^5.2.1"` (dependencia directa que arrastra `qs`).
- `pnpm-lock.yaml:665` y `pnpm-lock.yaml:1139` — resuelve `qs@6.15.3` vía
  `express>body-parser>qs` y `express>qs`.
- `src/presentation/server.ts:31-32` — `express.json()` y
  `express.urlencoded({ extended: true })` montados globalmente con `this.app.use(...)`,
  antes de cualquier ruteo: procesan `qs` sobre **todo** request entrante, exista o no la
  ruta.
- `src/presentation/health/controller.ts:32` — `HealthQueryDto.create( req.query )`: el
  parseo de `req.query` en Express 5 usa `qs` (parser `"extended"`, el default) antes de
  que el DTO valide nada.

## Descripción

`pnpm audit` (con red disponible) reporta dos avisos de severidad "moderate" sobre la
versión resuelta de `qs`, `6.15.3`, arrastrada transitivamente por `express@5.2.1`
(directamente y vía `body-parser`):

- **GHSA-x5fp-wj9c-mxmx** — bypass del límite `arrayLimit` de `qs` mediante una clave de
  corchete con comas, permitiendo construir arrays mucho más grandes que el límite
  configurado (por defecto 20). Rango vulnerable: `>=6.14.2 <=6.15.3`. Parcheado en
  `>=6.15.4`.
- **GHSA-4mjr-xmp4-gh2g** — denegación de servicio en `qs` vía manipulación del chequeo
  `isBuffer`, que permite provocar un consumo de recursos desproporcionado al parseo de
  ciertas estructuras. Rango vulnerable: `>=2.2.5 <6.16.0`. Parcheado en `>=6.16.0`.

La versión instalada (`6.15.3`) cae en el rango vulnerable de **ambos** avisos. Confianza
**Alta**: la versión vulnerable está confirmada por `pnpm audit` contra el lockfile real
del proyecto, y el punto de entrada (`req.query` en cualquier ruta, y el body
`urlencoded` global) es atacante-controlado sin autenticación previa — este proyecto no
tiene ninguna capa de auth.

## Impacto y vector de ataque

PoC **conceptual** (sin payload ejecutable):

1. El middleware `express.urlencoded({ extended: true })` (`server.ts:32`) y el parseo
   `qs` de `req.query` se ejecutan para **cualquier** request HTTP entrante al proceso,
   incluida la única ruta pública `GET /api/health` — no hace falta autenticación ni que
   la ruta exista, porque el middleware corre antes del ruteo.
2. Un atacante envía una query string o un body `application/x-www-form-urlencoded`
   diseñado para explotar el bypass de `arrayLimit` (claves de corchete con listas
   separadas por comas) o el patrón de `isBuffer` del segundo aviso.
3. `qs` invierte una cantidad de trabajo (CPU/memoria) desproporcionada al tamaño del
   payload recibido, antes de que `HealthQueryDto.create()` tenga oportunidad de
   rechazar nada — la validación de dominio ocurre **después** del parseo vulnerable.
4. Con el proceso Node single-threaded de este template (`src/presentation/server.ts`,
   sin cluster ni límite de recursos), una sola petición bien construida puede degradar
   o tumbar el servicio para todos los usuarios (impacto de disponibilidad).

No se requiere sesión, token ni conocimiento del contrato — solo alcanzar cualquier ruta
montada por `AppRoutes.routes` (`src/presentation/routes.ts`).

## Evidencia

```
$ pnpm audit
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ moderate            │ qs array-limit bypass via bracket-key comma parsing     │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ qs                                                      │
│ Vulnerable versions │ >=6.14.2 <=6.15.3                                       │
│ Patched versions    │ >=6.15.4                                                │
│ Paths               │ .>express>body-parser>qs  /  .>express>qs               │
│ More info           │ https://github.com/advisories/GHSA-x5fp-wj9c-mxmx       │
└─────────────────────┴────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ moderate            │ qs: Denial of Service via Attacker Controlled isBuffer  │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ qs                                                      │
│ Vulnerable versions │ >=2.2.5 <6.16.0                                         │
│ Patched versions    │ >=6.16.0                                                │
│ Paths               │ .>express>body-parser>qs  /  .>express>qs               │
│ More info           │ https://github.com/advisories/GHSA-4mjr-xmp4-gh2g       │
└─────────────────────┴────────────────────────────────────────────────────────┘
2 vulnerabilities found
Severity: 2 moderate
```

```ts
// src/presentation/server.ts:28-35
async start() {

  // Parsear body como JSON y como form-urlencoded
  this.app.use(express.json());
  this.app.use(express.urlencoded({ extended: true }));   // ← usa `qs` internamente

  // Registrar todas las rutas de la aplicación
  this.app.use(this.routes);
```

## Remediación

El fix es puramente de **gestión de dependencias**, no de arquitectura: no hace falta
ningún puerto ni adapter nuevo porque `qs` ya es un detalle interno de `express`, envuelto
por el propio framework — no hay ninguna capa de dominio que lo llame directamente.

| Pieza | Capa | Nota |
|---|---|---|
| Bump de `express` (o `pnpm.overrides`/`resolutions` fijando `qs@>=6.15.4` para GHSA-x5fp y `>=6.16.0` para GHSA-4mjr) | `package.json` / `pnpm-lock.yaml` | Sin cambios de código: `qs` no se importa en ningún archivo de `src/`. Verificar tras el bump con `grep -rn "from 'qs'" src/` (debe seguir sin resultados). |
| Límite explícito de tamaño de body | `src/presentation/server.ts` (composition de middlewares, capa `presentation`) | Ejemplo: `express.urlencoded({ extended: true, limit: '10kb' })` — defensa adicional independiente del parche, no sustituye el bump de `qs`. |

No se propone ningún adapter en `infrastructure/`: `qs` no entra nunca a `domain/` (está
en `layers.bannedInInner` implícitamente al ser transitivo de `express`, que sí está
baneado en la capa interna), así que actualizar la dependencia no toca la Regla de
Dependencia.

## Acceptance criteria propuestos

1. `pnpm audit` (o `pnpm audit --prod`) no reporta ningún aviso sobre `qs` tras el fix.
2. `pnpm why qs` resuelve a una versión `>=6.16.0` (cubre ambos rangos vulnerables).
3. `./init.sh` sigue en verde (tests + typecheck + guard de la Regla de Dependencia) tras
   el bump — no se espera ningún cambio de comportamiento observable en
   `GET /api/health`.
4. (Opcional, defensa en profundidad) `express.urlencoded()` declara un `limit` explícito
   y hay un test que confirma que un body por encima del límite responde `413` en vez de
   colgar el proceso.

## Superficie HTTP afectada

`api: false` — no cambia rutas, códigos de estado documentados ni schemas de
`docs/api/openapi.yaml`. Es un bump de dependencia transitiva; el comportamiento de
`GET /api/health` no cambia.

## Trazabilidad

- Auditoría: `docs/security/2026-09-15-audit.md`
- Feature: `sec_001_qs_dos_dependencia_vulnerable` (feature #2 en `feature_list.json`)
- Spec: —
