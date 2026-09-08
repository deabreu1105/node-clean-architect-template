
import { Router } from 'express';

import type { Clock, HealthRepository } from '../../domain/index.js';
import { HealthController } from './controller.js';

// CAPA: Presentation | TIPO: Router
//
// Factory: recibe los puertos de domain ya construidos y arma el controller.
// Depende solo de las abstracciones, nunca de una clase de infrastructure.
export class HealthRoutes {

  static routes( healthRepository: HealthRepository, clock: Clock ): Router {
    const router = Router();
    const controller = new HealthController( healthRepository, clock );

    router.get('/', controller.getHealth);

    return router;
  }

}
