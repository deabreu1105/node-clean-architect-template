import type { PublicUser } from "../entities/user.entity.js";


// Interfaz que define la respuesta que retornan los casos de uso de autenticación.
// Se ubica en domain/interfaces para ser compartida entre todos los use-cases
// sin duplicar su definición. `user` reusa PublicUser (UserEntity.toPublic())
// para garantizar que nunca se filtre el password.
export interface UserToken {
    token: string;
    user: PublicUser;
}
