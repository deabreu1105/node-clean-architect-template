
import { envs } from '../../config/index.js';
import { HealthRepository, type HealthSnapshot } from '../../domain/index.js';

// CAPA: Infrastructure | TIPO: Implementación concreta de HealthRepository
//
// ÚNICO archivo de este feature que lee config/. Ese es justamente el punto: la
// variable de entorno entra al sistema por aquí, y el use-case la recibe ya
// resuelta sin saber que existe un .env.
export class HealthRepositoryImpl extends HealthRepository {

  getSnapshot(): HealthSnapshot {
    return {
      appName: envs.APP_NAME,
      uptimeSeconds: Math.round( process.uptime() ),
      nodeVersion: process.version,
    };
  }

}
