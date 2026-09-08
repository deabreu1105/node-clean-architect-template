import type { UserEntity } from "../../entities/user.entity.js";
import type { AuthRepository } from "../../repositories/auth.repository.js";


// CAPA: Domain | TIPO: UseCase
//
// Resuelve un usuario a partir de su id. Lo usa el middleware de autenticación
// para confirmar que el usuario del token JWT sigue existiendo, sin que la
// capa de presentation necesite conocer MongoDB.
interface FindUserByIdUseCase {
    execute( id: string ): Promise<UserEntity>;
}


export class FindUserById implements FindUserByIdUseCase {

    constructor(
        private readonly authRepository: AuthRepository,
    ) {}

    execute( id: string ): Promise<UserEntity> {
        return this.authRepository.findById( id );
    }
}
