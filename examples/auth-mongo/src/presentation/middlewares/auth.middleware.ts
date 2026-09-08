import type { Request, Response, NextFunction, RequestHandler } from "express";
import { JwtAdapter } from "../../infrastructure/adapters/jwt.adapter.js";
import { CustomError, FindUserById, type AuthRepository } from "../../domain/index.js";


// CAPA: Presentation | TIPO: Middleware
//
// Protege rutas verificando el token JWT del header Authorization.
// Si el token es válido, adjunta el usuario a req.user para que el
// controlador lo tenga disponible sin volver a consultar la BD.
//
// Recibe AuthRepository por inyección (igual que el controller): el
// middleware solo conoce la abstracción del domain, nunca MongoDB.
//
// Flujo:
//   Request → [validateJWT] → válido → next() → Controller
//                           → inválido → 401 Unauthorized
export class AuthMiddleware {

    static validateJWT = ( authRepository: AuthRepository ): RequestHandler => {

        return async ( req: Request, res: Response, next: NextFunction ) => {

            const authorization = req.header( 'Authorization' );

            // El header debe existir y tener formato: "Bearer <token>"
            if ( !authorization ) return res.status( 401 ).json( { message: 'No token provided' } );
            if ( !authorization.startsWith('Bearer ') ) return res.status(401).json({ message: 'Invalid Bearer token' });

            const token = authorization.split(' ').at(1) || '';

            try {
                // Verificar firma y expiración del token
                const payload = await JwtAdapter.verifyToken<{ id: string }>(token);
                if ( !payload ) return res.status(401).json({ message: 'Invalid token' });

                // Verificar que el usuario del token aún exista, a través del
                // repositorio del domain (nunca tocando el modelo de Mongo aquí).
                req.user = await new FindUserById( authRepository ).execute( payload.id );

                next();

            } catch ( error ) {
                if ( error instanceof CustomError ) {
                    return res.status( error.statusCode ).json( { message: error.message } );
                }
                console.error( 'Error validating token', error );
                return res.status( 500 ).json( { message: 'Internal server error' } );
            }
        };
    }

}
