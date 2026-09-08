
import { Router } from 'express';

import type { Clock, HealthRepository } from '../domain/index.js';
import { HealthRoutes } from './health/routes.js';

// Router raíz. Una línea por grupo de rutas montado.
// Los puertos llegan por parámetro desde el composition root y se pasan hacia
// abajo; ningún archivo de presentation/ instancia una clase de infrastructure.
export class AppRoutes {

  static routes( healthRepository: HealthRepository, clock: Clock ): Router {
    const router = Router();

    router.use('/api/health', HealthRoutes.routes( healthRepository, clock ));

    return router;
  }

}
