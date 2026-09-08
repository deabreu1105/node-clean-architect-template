import type { Request, Response } from "express";
import { AuthRepository, CustomError, GetUsers, LoginUser, LoginUserDto, RegisterUser, RegisterUserDto } from "../../domain/index.js";
import { JwtAdapter } from "../../infrastructure/adapters/jwt.adapter.js";


// CAPA: Presentation | TIPO: Controlador
//
// Responsabilidades únicas del controlador (3 pasos siempre):
//   1. Validar la entrada con un DTO
//   2. Ejecutar el caso de uso correspondiente
//   3. Retornar la respuesta HTTP
//
// El controlador NO contiene lógica de negocio.
// Recibe AuthRepository como abstracción, no la implementación concreta.
export class AuthController {

  constructor(
    private readonly authRepository: AuthRepository,
  ) {}


  // Centraliza el manejo de errores:
  //   - CustomError → respuesta con su propio statusCode (400, 401, 404...)
  //   - Error inesperado → log en consola + 500
  private handleError( error: unknown, res: Response ) {
    if ( error instanceof CustomError ) {
      return res.status( error.statusCode ).json({ error: error.message });
    }
    console.error( error );
    res.status( 500 ).json( { error: 'Internal server error' } );
  }


  registerUser = async( req: Request, res: Response ) => {
    const [ errorDto, registerUserDto ] = RegisterUserDto.create(req.body);
    if ( errorDto ) return res.status( 400 ).json({ error: errorDto });

    new RegisterUser( this.authRepository, JwtAdapter.generateToken )
      .execute( registerUserDto! )
      .then( data => res.json( data ) )
      .catch( error => this.handleError( error, res ) );
  }


  getUsers = ( req: Request, res: Response ) => {
    new GetUsers( this.authRepository )
      .execute()
      .then( users => res.json({
        users: users.map( user => user.toPublic() ),
        user: req.user?.toPublic(),
      }) )
      .catch( error => this.handleError( error, res ) );
  }


  loginUser = ( req: Request, res: Response ) => {
    const [ errorDto, loginUserDto ] = LoginUserDto.login(req.body);
    if ( errorDto ) return res.status( 400 ).json({ error: errorDto });

    new LoginUser( this.authRepository, JwtAdapter.generateToken )
      .execute( loginUserDto! )
      .then( data => res.json( data ) )
      .catch( error => this.handleError( error, res ) );
  }

}