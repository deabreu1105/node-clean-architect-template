import { UserModel } from "../../data/mongodb/index.js";
import { CustomError, type AuthDataSource, type RegisterUserDto, UserEntity, LoginUserDto } from "../../domain/index.js";
import { BcryptAdapter, UserMapper } from "../index.js";


// CAPA: Infrastructure | TIPO: Implementación concreta de AuthDataSource
//
// Implementa los contratos definidos en domain/datasources/auth.datasource.ts
// usando MongoDB como fuente de datos.
//
// Las funciones de hashing se inyectan en el constructor para facilitar el testing:
// en tests se pueden pasar mocks sin necesidad de tocar bcrypt.
type HashPasswordFunction = (password: string) => string;
type ComparePasswordFunction = (password: string, hashedPassword: string) => boolean;


export class MongoDBAuthDataSourceImpl implements AuthDataSource {

    constructor(
        private readonly hashPassword: HashPasswordFunction = BcryptAdapter.hashPassword,
        private readonly comparePassword: ComparePasswordFunction = BcryptAdapter.comparePassword,
    ) {}


    async login(loginUserDto: LoginUserDto): Promise<UserEntity> {

        const { email, password } = loginUserDto;

        try {
            // 1. Verificar que el usuario existe
            const existingUser = await UserModel.findOne({ email });
            if (!existingUser) throw CustomError.badRequest('User does not exist - email');

            // 2. Verificar la contraseña contra el hash almacenado
            const isPasswordValid = this.comparePassword(password, existingUser.password);
            if (!isPasswordValid) throw CustomError.unauthorized('Invalid password');

            // 3. Convertir el documento de MongoDB a UserEntity del domain
            return UserMapper.userEntityFromObject(existingUser);

        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError();
        }
    }

    async register( registerUserDto: RegisterUserDto ) : Promise<UserEntity> {

        const { name, email, password } = registerUserDto;

        try {
            // 1. Verificar que el email no esté en uso
            const existingUser = await UserModel.findOne({ email });
            if ( existingUser ) throw CustomError.badRequest('Email already exists');

            // 2. Crear el documento con la contraseña hasheada (nunca se guarda en texto plano)
            const newUser = new UserModel({
                name,
                email,
                password: this.hashPassword(password),
            });

            // 3. Persistir en MongoDB
            await newUser.save();

            // 4. Convertir el documento guardado a UserEntity del domain
            return UserMapper.userEntityFromObject(newUser);

        } catch (error) {
            if ( error instanceof CustomError ) throw error;
            throw CustomError.internalServerError();
        }
    }

    async getUsers(): Promise<UserEntity[]> {
        try {
            const users = await UserModel.find();
            return users.map( user => UserMapper.userEntityFromObject(user) );
        } catch (error) {
            if ( error instanceof CustomError ) throw error;
            throw CustomError.internalServerError();
        }
    }

    async findById( id: string ): Promise<UserEntity> {
        try {
            // Un id que no exista (o con formato inválido) se trata como sesión
            // inválida: el llamador típico es el middleware de autenticación.
            const user = await UserModel.findById( id );
            if ( !user ) throw CustomError.unauthorized('User not found');

            return UserMapper.userEntityFromObject(user);

        } catch (error) {
            if ( error instanceof CustomError ) throw error;
            throw CustomError.internalServerError();
        }
    }

}