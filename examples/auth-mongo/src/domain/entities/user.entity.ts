
// Entidad del domain: representa un usuario tal como existe dentro de la aplicación.
//
// DIFERENCIA CLAVE con el modelo de MongoDB:
//   - UserModel  → documento de Mongoose, acoplado a la BD (tiene _id, __v, etc.)
//   - UserEntity → objeto puro del domain, sin dependencias externas
//
// Esto aplica el principio de aislamiento: si cambias MongoDB por PostgreSQL,
// UserEntity no cambia. Solo cambia el mapper y el datasource en infrastructure.


// Forma segura de un usuario para cruzar el límite HTTP: nunca incluye el
// hash de la contraseña ni campos de persistencia (_id, __v, etc.).
export interface PublicUser {
  id: string;
  name: string;
  email: string;
}


export class UserEntity {

  constructor(
    public id: string,
    public name: string,
    public email: string,
    public password: string,
    public roles: string[],
    public img?: string,
  ) {}

  // Única fuente de verdad de "qué es seguro exponer de un usuario".
  // Cualquier respuesta HTTP que incluya un usuario debe pasar por aquí
  // en lugar de serializar la entidad completa (que trae el password).
  toPublic(): PublicUser {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
    };
  }

}
