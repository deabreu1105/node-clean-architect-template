
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

    // Sin console.error aquí a propósito: una factory no debe tener efectos
    // secundarios. Loguear en CONSTRUCCIÓN significa que un error capturado y
    // convertido también loguea, y ensuciaba la salida de los tests que
    // provocan un fallo a propósito. El log va en el borde (el handler de
    // errores de la capa de entrega), que es quien sabe si el error se está
    // manejando o se está escapando.
    static internalServerError( message: string = 'Internal Server Error' ) {
        return new CustomError(500, message);
    }

    static forbidden( message: string ) {
        return new CustomError(403, message);
    }

}