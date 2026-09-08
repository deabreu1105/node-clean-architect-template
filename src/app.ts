import { envs } from "./config/index.js";
import { HealthRepositoryImpl, systemClock } from "./infrastructure/index.js";
import { AppRoutes } from "./presentation/routes.js";
import { Server } from "./presentation/server.js";


// Punto de entrada. `main()` se espera de verdad y su fallo termina el proceso.
main().catch((error) => {
  console.error('No se pudo arrancar la aplicación:', error);
  process.exit(1);
});


async function main() {

  // Composition root: ÚNICO lugar de la aplicación donde se instancian
  // implementaciones concretas de infrastructure. Todo lo que está por debajo
  // (presentation) solo recibe las abstracciones de domain.
  //
  // Al añadir un recurso nuevo (otro repositorio, otro grupo de rutas), la
  // composición se hace aquí. No hagas `new` de una clase de infrastructure en
  // ningún sitio bajo presentation/.
  const healthRepository = new HealthRepositoryImpl();

  // Iniciar el servidor HTTP con el puerto y las rutas configuradas.
  await new Server({
    port: envs.PORT,
    routes: AppRoutes.routes( healthRepository, systemClock ),
  }).start();

}
