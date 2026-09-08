
import type { Request, Response } from 'express';

import { CustomError, GetHealth, HealthQueryDto, type HealthRepository, type Clock } from '../../domain/index.js';

// CAPA: Presentation | TIPO: Controller
//
// Tres responsabilidades y ninguna más: validar el DTO, ejecutar el use-case y
// responder. Nada de lógica de negocio, nada de acceso a datos.
export class HealthController {

  // Recibe los puertos ya construidos. NUNCA hace `new` de una clase concreta
  // de infrastructure: eso solo ocurre en el composition root (checkpoint C5).
  constructor(
    private readonly healthRepository: HealthRepository,
    private readonly clock: Clock,
  ) {}

  // Convierte cualquier error en una respuesta. Los CustomError traen su propio
  // statusCode; el resto se loguea aquí (en el borde, no en la factory del
  // error) y sale como 500 sin filtrar el stack al cliente.
  private handleError = ( error: unknown, res: Response ) => {
    if ( error instanceof CustomError ) {
      res.status( error.statusCode ).json({ error: error.message });
      return;
    }
    console.error( error );
    res.status(500).json({ error: 'Internal Server Error' });
  };

  getHealth = ( req: Request, res: Response ) => {
    const [error, healthQueryDto] = HealthQueryDto.create( req.query );

    // Los DTOs no lanzan: se comprueba el slot de error y se responde 400.
    if ( error ) {
      res.status(400).json({ error });
      return;
    }

    try {
      const status = new GetHealth( this.healthRepository, this.clock ).execute();

      // Nunca se serializa la entidad directamente: siempre por toPublic().
      res.json( status.toPublic( healthQueryDto!.verbose ) );
    } catch ( err ) {
      this.handleError( err, res );
    }
  };

}
