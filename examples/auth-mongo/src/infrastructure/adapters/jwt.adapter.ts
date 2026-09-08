import jwt from 'jsonwebtoken';
import { envs } from '../../config/envs.js';


const JWT_SEED = envs.JWT_SEED;


// Adaptador del patrón Adapter sobre jsonwebtoken.
// Usa Promises en lugar de callbacks para integrarse con async/await.
export class JwtAdapter {

    // Firma un payload y retorna el token como string, o null si falla.
    // El payload debe contener solo datos no sensibles (ej: { id: user.id }).
    static generateToken( payload: object, duration: string = '2h' ): Promise<string | null> {
        return  new Promise( ( resolve ) => {
            jwt.sign(payload, JWT_SEED, { expiresIn: duration as any }, (err, token) => {
                if (err) return resolve(null);
                resolve(token ?? null);
            });
        });
    }

    // Verifica la firma del token y retorna el payload tipado, o null si es inválido/expirado.
    static verifyToken<T>( token: string ): Promise<T | null> {
        return new Promise( ( resolve ) => {
            jwt.verify( token, JWT_SEED, (err, decoded) => {
                if (err) return resolve(null);
                resolve(decoded as T);
            });
        });
    }

}
