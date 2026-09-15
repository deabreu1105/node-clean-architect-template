---
description: Audita el código en busca de vulnerabilidades usando el security_auditor. Escribe hallazgos en docs/security/.
---

# /security-audit

Lanza el subagente `security_auditor` definido en
[.claude/agents/security_auditor.md](../agents/security_auditor.md). No audites tú
mismo ni reproduzcas hallazgos en chat — eso es su trabajo, y vive en disco. Metodología
completa: `docs/security.md`.

## Tres modos de scope

- **Sin argumentos**: barrido completo del proyecto (`layers.sourceRoot`, `package.json`,
  el contrato API, configs relevantes).
- **Con una ruta o glob** (`/security-audit src/presentation/`): limita el análisis a ese
  subárbol.
- **Con `feature:<name>`** (`/security-audit feature:auth_jwt`): limita el análisis a los
  archivos que toca esa feature, según `specs/<name>/design.md`.

## Paso a paso

1. Ejecuta `./init.sh`. Si falla, **para** — no tiene sentido auditar un entorno roto.
2. Resuelve el scope según el argumento recibido (o su ausencia).
3. Lanza `security_auditor` con el scope resuelto.
4. **Regla anti-teléfono-descompuesto**: el `security_auditor` escribe en disco
   (`docs/security/**`) y devuelve una sola línea. No reproduzcas los hallazgos en chat.
5. Si generó `SEC-NNN` nuevos, lístalos al humano por id y severidad (puedes leer el
   frontmatter de cada archivo para eso) y recuérdale que el siguiente paso para
   cualquiera que quiera arreglar es `/fix-finding <id>`.

## Reglas duras

- ❌ NO audites tú mismo ni edites `docs/security/**` directamente.
- ❌ NO lances al `spec_author` ni a ningún otro subagente a continuación — un hallazgo
  se convierte en feature solo vía `/fix-finding`, con decisión humana de por medio.
- ❌ NO marques ningún hallazgo como `accepted_risk` o `false_positive` sin que el humano
  lo pida explícitamente.

## Salida esperada en chat

```
audit_complete -> docs/security/2026-09-15-audit.md (3 hallazgos: 1 Alta, 2 Media)

SEC-001 (Alta)  — JWT sin expiración
SEC-002 (Media) — CORS permisivo en presentation/server.ts
SEC-003 (Media) — Falta rate limiting en /api/health

Usa /fix-finding <id> para convertir uno en feature.
```
