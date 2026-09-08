
import type { UserEntity } from "../entities/user.entity.js";
import type { RegisterUserDto, LoginUserDto } from "../index.js";


// CAPA: Domain | TIPO: Contrato (clase abstracta)
//
// DataSource define QUÉ operaciones existen sobre la fuente de datos.
// NO sabe cómo se implementan ni qué base de datos se usa.
//
// Al ser abstracta, no puede instanciarse directamente.
// Su implementación concreta vive en infrastructure/datasources/.
//
// FLUJO: UseCase → Repository (abstracto) → DataSource (abstracto) → [impl concreta]
export abstract class AuthDataSource {

    abstract login( loginUserDto: LoginUserDto ) : Promise<UserEntity>;

    abstract register( registerUserDto: RegisterUserDto ) : Promise<UserEntity>;

    abstract getUsers(): Promise<UserEntity[]>;

    abstract findById( id: string ): Promise<UserEntity>;

}