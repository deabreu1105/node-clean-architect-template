// CAPA: Domain | TIPO: DTO (Data Transfer Object)
//
// Valida y transporta los datos necesarios para iniciar sesión.
// Mismo patrón que RegisterUserDto: constructor privado + factory estático.
import { Validators } from "../../validators.js";




export class LoginUserDto {

    private constructor(
        public email: string,
        public password: string,
    ) {}

    // Retorna [error, dto]. Si hay error, el primer elemento contiene el mensaje;
    // si es exitoso, el primer elemento es '' (vacío) y el segundo el DTO validado.
    static login( object: { [key: string]: any; } ) : [ string?, LoginUserDto? ] {
        const { email, password } = object;

        if ( !email ) return ['Email is required'];
        if ( !Validators.email.test(email) ) return ['Email is invalid'];
        if ( !password ) return ['Password is required'];
        if ( password.length < 6 ) return ['Password must be at least 6 characters long'];

        return [ '', new LoginUserDto(email, password) ];
    }

}