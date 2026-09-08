
// Validadores reutilizables para los DTOs del domain.
// Vive en domain/ (no en config/) porque es una regla de validación pura,
// sin dependencias externas: el domain no debe importar el barrel de config
// (que arrastra dotenv, env-var, bcryptjs y jsonwebtoken) solo para validar un email.
export class Validators {

  static get email() {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  }

}
