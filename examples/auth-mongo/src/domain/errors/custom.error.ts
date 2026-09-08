
// Error personalizado del domain que transporta un statusCode HTTP junto al mensaje.
//
// Al extender Error, se integra con el sistema nativo de excepciones de JS:
// se puede usar con throw/catch y conserva el stack trace.
//
// USO EN EL CONTROLADOR:
//   if (error instanceof CustomError) → respuesta con error.statusCode
//   else                              → error inesperado → 500
export class CustomError extends Error {

    constructor(
        public readonly statusCode: number,
        public readonly message: string,
    ) {
        // super() llama al constructor de Error con el mensaje,
        // lo que hace que error.message funcione correctamente.
        super(message);
    }


    static badRequest( message: string ) {
        return new CustomError(400, message);
    }

    static unauthorized( message: string ) {
        return new CustomError(401, message);
    }

    static notFound( message: string ) {
        return new CustomError(404, message);
    }

    static internalServerError( message: string = 'Internal Server Error' ) {
        console.error(message);
        return new CustomError(500, message);
    }

    static forbidden( message: string ) {
        return new CustomError(403, message);
    }

}