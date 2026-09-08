import { envs } from "./config/envs.js";
import { MongoDatabase } from "./data/mongodb/index.js";
import { AppRoutes } from "./presentation/routes.js";
import { Server } from "./presentation/server.js";
import { AuthRepositoryImpl, MongoDBAuthDataSourceImpl } from "./infrastructure/index.js";


// IIFE: punto de entrada de la aplicación.
// Se usa una función autoejecutable para poder usar async/await en el nivel raíz.
( async () => {
  main();
})();


async function main() {

    // 1. Conectar a la base de datos antes de levantar el servidor.
    //    Si la conexión falla, lanza un error y el proceso termina.
    await MongoDatabase.connect({
      mongoUrl: envs.MONGO_URL,
      dbName: envs.MONGO_DB_NAME,
    });

    // 2. Composition root: único lugar de la aplicación donde se instancian
    //    implementaciones concretas de infrastructure. Todo lo que está por
    //    debajo (presentation) solo recibe la abstracción AuthRepository.
    const datasource     = new MongoDBAuthDataSourceImpl();
    const authRepository = new AuthRepositoryImpl( datasource );

    // 3. Iniciar el servidor HTTP con el puerto y las rutas configuradas.
    new Server({
      port: envs.PORT,
      routes: AppRoutes.routes( authRepository ),
    }).start();
}
