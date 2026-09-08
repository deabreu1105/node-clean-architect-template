import type { UserEntity } from "../domain/index.js";


// Aumenta el tipo Request de Express para adjuntar el usuario autenticado
// como UserEntity del domain, en vez de sobrecargar req.body (pensado para
// el payload del cliente) con datos inyectados por un middleware.
declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
    }
  }
}
