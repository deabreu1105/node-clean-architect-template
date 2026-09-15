## Equivalencia con Jira Software

> Guía de **reflejo manual**, no una integración viva. El arnés no habla con la API de
> Jira — este documento existe para que un equipo que trabaja en Jira pueda mapear los
> artefactos de `specs/<name>/` a sus tipos de issue sin inventarse la correspondencia
> cada vez. Si en algún momento hace falta sincronización real (crear/actualizar issues,
> reflejar transiciones de estado), eso es una **feature nueva** que pasa por el flujo
> SDD completo como cualquier otra — diseño, posible contrato, spec, implementación — no
> se improvisa aquí ni se acopla a este documento.

## Tabla de equivalencia

| Arnés SDD | Jira Software |
|---|---|
| Una entrada de `feature_list.json` | Un issue tipo **Story** |
| `## Historia de usuario` en `requirements.md` | La descripción de la Story (formato Como/Quiero/Para) |
| `R<n>` en `requirements.md` (EARS) | Los criterios de aceptación de la Story |
| `## Escenarios de origen` en `requirements.md` (Gherkin) | Criterios de aceptación en formato Gherkin — soportado nativamente por plugins de testing tipo Xray o Zephyr, si tu instancia de Jira los usa |
| `T<n>` en `tasks.md` | Un **Sub-task** de esa Story |
| `progress/review_<name>.md` con veredicto `APPROVED` | Transición del issue a **Done** |
| `progress/review_<name>.md` con veredicto `CHANGES_REQUESTED` | El issue vuelve a **In Progress** (o el estado equivalente de tu workflow) |
| Campo `status: "blocked"` en `feature_list.json` | El issue pasa a **Blocked** (o la label/estado equivalente) |

## Granularidad: 1 feature = 1 Story, nunca un Epic

El arnés exige **una sola feature a la vez** (`maxInProgress: 1` en `harness.config.json`)
y una sola Historia de usuario por spec (`docs/specs.md` § Historia de usuario). Esto
coincide exactamente con el tamaño de una Story — no con un Epic.

Si tu equipo agrupa varias Stories relacionadas bajo un Epic en Jira, esa agrupación vive
del lado de Jira: varias entradas de `feature_list.json` (varias carpetas `specs/<name>/`,
implementadas una detrás de otra por la regla de una-a-la-vez) pueden apuntar al mismo
Epic sin que el arnés necesite modelar esa jerarquía. No hay campo `epic` — si hiciera
falta, la referencia va en la descripción de la Story en Jira, no aquí.

## El campo opcional `jira`

Cuando una feature ya tiene su Story creada en Jira, `feature_list.json` puede declarar
el issue key como referencia cruzada:

```json
{
  "id": 3,
  "name": "login",
  "title": "Inicio de sesión de usuarios",
  "jira": "PROJ-123",
  "description": "...",
  "acceptance": [ "..." ],
  "sdd": true,
  "api": false,
  "status": "pending"
}
```

- Es **opcional** — `scripts/check-feature-list.mjs` no lo valida ni lo exige; añadirlo o
  no añadirlo no cambia el veredicto de `./init.sh` (el validador solo comprueba los
  campos que ya conocía: `id`, `name`, `title`, `description`, `acceptance`, `sdd`, `api`,
  `status` — cualquier campo extra pasa desapercibido para él).
- Cuando existe, `requirements.md` lo repite en el encabezado de la Historia de usuario:
  `## Historia de usuario (PROJ-123)` — así el spec y el issue de Jira quedan cruzados
  con una sola mirada, sin tener que abrir `feature_list.json`.
- Es **solo una referencia**. Nadie la actualiza automáticamente si el issue cambia de
  estado en Jira, ni al revés. Si el issue key cambia o el issue se mueve de proyecto,
  se edita a mano — igual que cualquier otro campo de `feature_list.json`.

## Qué NO hace este documento

- No crea, actualiza ni consulta issues de Jira.
- No exige que uses Jira — el arnés funciona exactamente igual sin el campo `jira` en
  ninguna feature. Es aditivo, nunca obligatorio.
- No modela Epics, Sprints, ni ningún otro concepto de Jira más allá de Story/Sub-task —
  añadir eso, si hiciera falta, es una discusión de diseño nueva, no una extensión
  silenciosa de este documento.
