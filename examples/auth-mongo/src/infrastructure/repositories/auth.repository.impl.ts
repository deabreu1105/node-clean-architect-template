import type { AuthDataSource, AuthRepository, LoginUserDto, RegisterUserDto, UserEntity } from "../../domain/index.js";


// CAPA: Infrastructure | TIPO: Implementación concreta de AuthRepository
//
// Recibe un AuthDataSource por inyección de dependencias y delega todas las
// operaciones en él. Esta delegación es intencional: el repositorio actúa
// como punto de extensión donde en el futuro se puede añadir caché, logging,
// o combinar múltiples datasources sin modificar los UseCases.
export class AuthRepositoryImpl implements AuthRepository {

    constructor(
        private readonly authDataSource: AuthDataSource
    ) {}


    login(loginUserDto: LoginUserDto): Promise<UserEntity> {
        return this.authDataSource.login(loginUserDto);
    }

    register( registerUserDto: RegisterUserDto ) : Promise<UserEntity> {
        return this.authDataSource.register(registerUserDto);
    }

    getUsers(): Promise<UserEntity[]> {
        return this.authDataSource.getUsers();
    }

    findById( id: string ): Promise<UserEntity> {
        return this.authDataSource.findById( id );
    }

}