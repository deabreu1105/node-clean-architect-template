import { Router } from "express";
import { AuthController } from "./controller.js";
import type { AuthRepository } from "../../domain/index.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";


export class AuthRoutes {

  // Recibe el AuthRepository ya construido (inyectado desde el composition
  // root en app.ts): presentation solo conoce la abstracción del domain,
  // nunca instancia implementaciones concretas de infrastructure.
  static routes( authRepository: AuthRepository ): Router {

    const router = Router();

    const controller  = new AuthController( authRepository );
    const validateJWT = AuthMiddleware.validateJWT( authRepository );

    router.post('/login',    controller.loginUser);
    router.post('/register', controller.registerUser);

    // validateJWT protege la ruta: verifica el JWT antes de llegar al controlador.
    router.get('/users', [validateJWT], controller.getUsers);

    return router;
  }
}
