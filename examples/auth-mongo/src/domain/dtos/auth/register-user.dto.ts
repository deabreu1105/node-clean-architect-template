
// CAPA: Domain | TIPO: DTO (Data Transfer Object)
//
// Valida y transporta los datos necesarios para registrar un usuario.
// Patrón: constructor privado + método estático factory.
//   - El constructor privado impide crear instancias sin pasar por la validación.
//   - create() retorna [error, dto] en lugar de lanzar excepciones,
//     lo que hace que el controlador pueda responder con 400 de forma explícita.
import { Validators } from "../../validators.js";



export class RegisterUserDto {

  private constructor(
    public name: string,
    public email: string,
    public password: string,
  ) {}


  static create( object: { [key: string]: any; } ) : [ string?, RegisterUserDto? ] {

    const { name, email, password } = object;

    if ( !name ) return ['Name is required'];
    if ( !email ) return ['Email is required'];
    if ( !Validators.email.test(email) ) return ['Email is invalid'];
    if ( !password ) return ['Password is required'];
    if ( password.length < 6 ) return ['Password must be at least 6 characters long'];

    // Sin error: primer elemento vacío, segundo elemento es el DTO con email normalizado.
    return [ '', new RegisterUserDto(name, email.toLowerCase(), password) ];
  }

}