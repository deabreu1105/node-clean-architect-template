import type { RegisterUserDto } from "../../dtos/auth/register-user.dto.js";
import { CustomError } from "../../index.js";
import type { AuthRepository } from "../../repositories/auth.repository.js";
import type { UserToken } from "../../interfaces/user-token.interface.js";
import type { SignToken } from "../../interfaces/sign-token.interface.js";


// CAPA: Domain | TIPO: UseCase
//
// Orquesta el registro de un nuevo usuario.
// Solo conoce abstracciones (AuthRepository, SignToken), nunca implementaciones
// concretas: signToken es obligatorio y lo provee quien construye el use case
// (el controller), nunca un valor por defecto importado de config/.
interface RegisterUserUseCase {
    execute( registerUserDto: RegisterUserDto ): Promise<UserToken>;
}



export class RegisterUser implements RegisterUserUseCase {

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly signToken: SignToken,
    ) { }

    async execute( registerUserDto: RegisterUserDto ): Promise<UserToken> {

        // 1. Delegar la creación del usuario al repositorio (que llama al datasource)
        const user = await this.authRepository.register( registerUserDto );

        // 2. Generar el token JWT con el id del usuario recién creado
        const token = await this.signToken({ id: user.id }, '2h' );

        if ( !token ) throw CustomError.internalServerError( 'Error generating token' );

        return {
            token,
            user: user.toPublic(),
        };
    }
}
