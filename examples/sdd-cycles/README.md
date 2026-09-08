# Ciclos SDD terminados

Artefactos reales producidos por este mismo arnés en otros proyectos. Sirven
para ver **cómo se ve el output** de cada fase, que es más útil que la
descripción del formato.

| Directorio | Qué contiene |
|---|---|
| [`notes-cli/`](notes-cli/) | Un ciclo SDD **completo**: 4 features especificadas, implementadas y aprobadas. Trae los `specs/<name>/{requirements,design,tasks}.md` con todas las tasks en `[x]`, los informes `progress/impl_*.md` y los veredictos `progress/review_*.md` con su `APPROVED`. Es de otro proyecto (un CLI de notas en JS plano, stdlib-only y sin capas), así que fíjate en el **método**, no en el stack |
| [`hello-world-incompleto/`](hello-world-incompleto/) | Una feature **detenida en la puerta de aprobación humana**: tiene documento de ideación y los tres archivos de spec, pero cero código. Es el ejemplo de qué aspecto tiene el estado `spec_ready` |
| [`history-ejemplo.md`](history-ejemplo.md) | Una `progress/history.md` real, con siete sesiones documentadas. Muestra el nivel de detalle que se espera en una entrada de bitácora |

Ninguno de estos artefactos está en `feature_list.json`, así que `./init.sh` no
los valida ni espera nada de ellos.
