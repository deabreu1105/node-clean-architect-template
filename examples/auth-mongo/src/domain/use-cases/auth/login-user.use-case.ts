import type { LoginUserDto } from "../../dtos/auth/login-user.dto.js";
import { CustomError } from "../../index.js";
import type { AuthRepository } from "../../repositories/auth.repository.js";
import type { UserToken } from "../../interfaces/user-token.interface.js";
import type { SignToken } from "../../interfaces/sign-token.interface.js";


// CAPA: Domain | TIPO: UseCase
//
// Orquesta el inicio de sesión de un usuario.
// Mismo patrón que RegisterUser: inyección de repositorio y de la función de
// firma (obligatoria, sin default hacia config/).
interface LoginUserUseCase {
    execute( loginUserDto: LoginUserDto ): Promise<UserToken>;
}



export class LoginUser implements LoginUserUseCase {

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly signToken: SignToken,
    ) { }

    async execute( loginUserDto: LoginUserDto ): Promise<UserToken> {

        // 1. Verificar credenciales a través del repositorio
        const user = await this.authRepository.login( loginUserDto );

        // 2. Generar token JWT con el id del usuario autenticado
        const token = await this.signToken({ id: user.id }, '2h' );

        if ( !token ) throw CustomError.internalServerError( 'Error generating token' );

        return {
            token,
            user: user.toPublic(),
        };
    }
}
