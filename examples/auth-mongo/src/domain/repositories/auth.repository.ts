
import type { UserEntity } from "../entities/user.entity.js";
import type { RegisterUserDto, LoginUserDto } from "../index.js";


// CAPA: Domain | TIPO: Contrato (clase abstracta)
//
// Repository es el intermediario entre los UseCases y el DataSource.
// Los UseCases dependen de esta abstracción, no de la implementación concreta.
//
// ¿Por qué existe el Repository si tiene los mismos métodos que el DataSource?
// Porque permite añadir lógica entre capas sin modificar el UseCase:
//   - combinar múltiples datasources
//   - agregar caché
//   - transformar resultados antes de retornarlos
//
// Su implementación concreta vive en infrastructure/repositories/.
export abstract class AuthRepository {

    abstract login( loginUserDto: LoginUserDto ) : Promise<UserEntity>;

    abstract register( registerUserDto: RegisterUserDto ) : Promise<UserEntity>;

    abstract getUsers(): Promise<UserEntity[]>;

    abstract findById( id: string ): Promise<UserEntity>;

}