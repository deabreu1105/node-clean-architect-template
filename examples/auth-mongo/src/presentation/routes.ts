import { Router } from "express";
import { AuthRoutes } from "./auth/routes.js";
import type { AuthRepository } from "../domain/index.js";


export class AppRoutes {

  static routes( authRepository: AuthRepository ): Router {

    const router = Router();

    //Se definen todas las rutas principales
    router.use('/api/auth', AuthRoutes.routes( authRepository ));

    return router;

  }
}
