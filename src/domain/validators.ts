
// Validadores compartidos por los DTOs.
//
// Viven en domain y NO en config precisamente para que la capa interna nunca
// tenga que importar config: importar el barrel de config arrastraría envs.ts,
// que ejecuta dotenv al cargarse, y entonces los tests de dominio dejarían de
// poder correr sin un .env.
export class Validators {

  // Los query params de HTTP llegan siempre como string. Devuelve null cuando el
  // valor no es un booleano reconocible, para que el DTO lo trate como error en
  // vez de asumir un default silencioso.
  static boolean( value: unknown ): boolean | null {
    if ( value === undefined || value === '' ) return false;
    if ( value === 'true'  || value === true  ) return true;
    if ( value === 'false' || value === false ) return false;
    return null;
  }

}
