// Firma de la función de generación de tokens que los use-cases de auth
// reciben inyectada. El domain solo conoce esta forma, nunca JwtAdapter
// directamente: quien construye el use case (el composition root o el
// controller) decide qué implementación concreta pasar.
export type SignToken = ( payload: object, duration?: string ) => Promise<string | null>;
