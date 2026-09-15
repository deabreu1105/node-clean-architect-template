## Auditoría de seguridad

> Metodología de la auditoría de seguridad bajo demanda. Paralelo a `docs/api-design.md`
> y `docs/specs.md`: define el contrato de artefactos para que el agente `security_auditor`
> y los comandos `/security-audit` / `/fix-finding` no lo dupliquen cada uno a su manera.

La auditoría de seguridad es un **camino de entrada alternativo** al flujo SDD normal,
igual que `/brainstorm` y `/add-feature` — no lo sustituye. El `security_auditor` nunca
toca código: encuentra y documenta, y cada hallazgo que se decide arreglar se convierte
en una feature que pasa por las mismas tres puertas que cualquier otra.

```
/security-audit [scope]
        │
        ▼
 [security_auditor]  ← skill security-review (OWASP) + este documento
        │
        ├─ docs/security/YYYY-MM-DD-audit.md          (resumen ejecutivo + superficie de ataque)
        └─ docs/security/findings/SEC-NNN-<slug>.md   (uno por hallazgo, status: open)
        │
        ▼
   ⏸ HUMANO PRIORIZA
        │
/fix-finding SEC-001
        │
        ▼
 feature_list.json: #N sec_001_<slug> (pending, sdd:true)
        │
        ▼
 flujo SDD normal: /implement-next → ⏸ → /approve-spec → implementer → reviewer → done
        │
        ▼
 /close-session: SEC-001 status → fixed
```

## Cuándo correr una auditoría

Bajo demanda, con `/security-audit`, en tres modos de scope:

| Invocación | Scope |
|---|---|
| `/security-audit` | Barrido completo: `src/**`, `package.json`, `docs/api/openapi.yaml`, configs |
| `/security-audit <ruta o glob>` | Un subárbol concreto, p. ej. `src/presentation/` |
| `/security-audit feature:<name>` | Los archivos del § *Alcance y archivos a tocar* de `specs/<name>/design.md` |

No hay disparo automático: ni el `reviewer` ni `init.sh` invocan al `security_auditor`.
Si tu proyecto necesita eso más adelante, es un cambio de arnés (un futuro checkpoint
`C12`), no algo que se improvisa aquí.

## Fase 1 — Reconocimiento

Antes de buscar vulnerabilidades, el auditor mapea la superficie de ataque:

- Stack tecnológico (lenguaje, framework, base de datos/ORM si aplica).
- Puntos de entrada: rutas montadas en `harness.api.routerFactory`, WebSockets, workers.
- Capas de autenticación, autorización y manejo de sesiones.
- Manejo de uploads, archivos estáticos y assets de terceros.

Resultado: la sección "Superficie de ataque" de `docs/security/YYYY-MM-DD-audit.md`.

## Fase 2 — Análisis de vulnerabilidades

El auditor aplica el *Review Process* del skill `security-review`
(`.claude/skills/security-review/SKILL.md`): detectar el tipo de código, cargar las
referencias OWASP relevantes (`references/*.md`) y la guía de lenguaje
(`languages/javascript.md` para este stack), investigar el flujo de datos antes de
reportar, y filtrar por confianza — **solo hallazgos de confianza HIGH se reportan**;
MEDIUM va a "Necesita verificación"; LOW no se reporta (es la distinción del skill entre
lo teórico y lo explotable).

Cobertura mínima, aunque el skill puede encontrar más categorías que estas:

- Inyección: SQL, NoSQL, comandos OS, LDAP, SSTI
- XSS: reflejado, almacenado y basado en DOM
- Autenticación: hashing de contraseñas, fuerza bruta, bypass de 2FA
- Autorización: IDOR, privilege escalation (horizontal y vertical)
- Sesiones / JWT: expiración, rotación, validación de firma y algoritmo
- CSRF: tokens, SameSite cookies
- SSRF: validación de URLs en peticiones salientes / webhooks
- Deserialización insegura y prototype pollution
- Path traversal y file upload sin validación de tipo/contenido
- Race conditions en operaciones críticas y transacciones
- Secrets hardcodeados: API keys, tokens, credenciales en el repo
- Dependencias vulnerables: `pnpm audit` (o equivalente del stack) si hay red disponible
- Configuración: CORS permisivo, headers de seguridad faltantes (CSP, HSTS,
  X-Frame-Options)
- Rate limiting ausente en endpoints sensibles (login, registro, reseteo de contraseña)
- Validación de input en cliente vs servidor, sanitize/escape
- Mass assignment en ORMs / deserialización directa de DTOs

## Fase 3 — El contrato de un hallazgo

Cada vulnerabilidad de confianza HIGH se documenta en su propio archivo,
`docs/security/findings/SEC-NNN-<slug>.md`, con este frontmatter y estas secciones:

```markdown
---
id: SEC-001
severity: High            # Critical | High | Medium | Low
confidence: High          # High | Medium
status: open              # open | feature | fixed | accepted_risk | false_positive
cwe: CWE-613
audit: 2026-09-15
feature: null             # lo rellena /fix-finding
---

# SEC-001 — <título corto>

## Ubicación
`src/presentation/auth/controller.ts:42`

## Descripción

## Impacto y vector de ataque
PoC **conceptual** — pasos del ataque, nunca un payload ejecutable.

## Evidencia
\`\`\`ts
<snippet vulnerable>
\`\`\`

## Remediación
Ejemplo de código seguro + **en qué capa vive el fix**:

| Pieza | Capa | Nota |
|---|---|---|
| `TokenPort.verify()` | `domain/interfaces/` | puerto nuevo |
| `jwtAdapter` | `infrastructure/adapters/` | envuelve `jsonwebtoken` |

## Acceptance criteria propuestos
1. <criterio verificable por un test>
2. ...

## Superficie HTTP afectada
`api: true|false` — si el fix cambia rutas, códigos de estado o schemas del contrato.

## Trazabilidad
- Auditoría: `docs/security/2026-09-15-audit.md`
- Feature: —
- Spec: —
```

**La sección `## Remediación` siempre declara la capa.** Es lo que evita que un fix de
seguridad rompa la Regla de Dependencia: si el hallazgo exige algo externo (firma de
tokens, hashing, un cliente HTTP saliente), la remediación lo expresa como un puerto en
`domain/` más un adapter en `infrastructure/`, nunca como una llamada directa a la
librería desde la capa interna. Ver `docs/architecture.md`.

Las secciones `## Acceptance criteria propuestos` y `## Superficie HTTP afectada` son el
puente hacia `feature_list.json`: `/fix-finding` las copia literalmente, sin tener que
volver a razonar el problema.

### Severidad

| Severidad | Impacto | Ejemplos |
|---|---|---|
| **Critical** | Exploit directo, impacto severo, sin autenticación requerida | RCE, SQLi con exfiltración de datos, bypass de auth, secrets hardcodeados |
| **High** | Explotable con condiciones, impacto significativo | XSS almacenado, SSRF a metadata, IDOR sobre datos sensibles |
| **Medium** | Requiere condiciones específicas, impacto moderado | XSS reflejado, CSRF sobre acciones que cambian estado, path traversal |
| **Low** | Defensa en profundidad, impacto directo mínimo | Headers faltantes, errores verbosos, algoritmos débiles en contexto no crítico |

Mapea a CVSS v3.1 (Crítica/Alta/Media/Baja/Info), la escala que pidió el equipo al dar
el prompt original de esta auditoría.

### Estados de un hallazgo

```
open ──/fix-finding──▶ feature ──close-session (feature done)──▶ fixed
  │
  ├──▶ accepted_risk       (decisión humana documentada, terminal)
  └──▶ false_positive      (el auditor o un humano lo descarta, terminal)
```

- **`open`** — recién encontrado, sin decisión tomada. Lo pone el `security_auditor`.
- **`feature`** — ya tiene una entrada en `feature_list.json`. Lo pone `/fix-finding`.
- **`fixed`** — la feature llegó a `done` y el reviewer aprobó. Lo pone `/close-session`.
- **`accepted_risk`** / **`false_positive`** — terminales, decisión humana explícita
  documentada en el propio archivo del hallazgo (por qué se acepta el riesgo, o por qué
  no es explotable).

### Numeración

`SEC-NNN` es global y monótonamente creciente — nunca se reutiliza un número, ni
siquiera si el hallazgo resulta ser `false_positive`. El siguiente número sale de mirar
`docs/security/findings/` y tomar `max(NNN) + 1` (o `001` si el directorio está vacío).

## Fase 4 — De hallazgo a feature

`/fix-finding SEC-NNN` es la única vía para que un hallazgo toque código: inserta una
feature `pending` con `sdd: true` en `feature_list.json`, copiando los acceptance
criteria y el flag `api` del propio hallazgo. Desde ahí sigue el flujo SDD normal
(`docs/specs.md`) — spec, aprobación humana, implementación, review. El `security_auditor`
**nunca** escribe en `feature_list.json` ni en `specs/`, y nunca edita `src/`.

Esto es deliberado: la Fase 4 de una auditoría clásica ("propón un plan de remediación
priorizado y aplica los parches con mi confirmación") aquí se reemplaza por el flujo SDD
completo — spec, tests, reviewer — porque un parche de seguridad sin spec ni tests es
exactamente el tipo de cambio que este arnés existe para evitar.
