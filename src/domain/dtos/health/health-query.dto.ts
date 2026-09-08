
import { Validators } from '../../validators.js';

// CAPA: Domain | TIPO: DTO
//
// Los DTOs NUNCA lanzan: constructor privado + factory estática que devuelve la
// tupla [error?, dto?]. El controller comprueba el primer slot y responde 400
// directamente, sin try/catch. Sigue este patrón para cualquier DTO nuevo.
export class HealthQueryDto {

  private constructor(
    public readonly verbose: boolean,
  ) {}

  // Devuelve [error, dto]. Si hay error, el primer elemento lleva el mensaje;
  // si va bien, el primero es '' (vacío) y el segundo el DTO ya validado.
  static create( query: Record<string, unknown> ): [string?, HealthQueryDto?] {
    const verbose = Validators.boolean( query['verbose'] );

    if ( verbose === null ) return ['verbose debe ser "true" o "false"'];

    return ['', new HealthQueryDto( verbose )];
  }

}
