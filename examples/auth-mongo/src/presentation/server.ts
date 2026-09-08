import express, { Router } from 'express';
import type { Express } from 'express';


// Puerto y rutas como opciones inyectables → facilita tests de integración
// donde se puede levantar el servidor en un puerto aleatorio.
interface Options {
  port?: number;
  routes: Router;
}


export class Server {

  public readonly app: Express = express();
  private readonly port: number;
  private readonly routes: Router;

  constructor( options: Options ) {
    const { port = 3100, routes } = options;
    this.port = port;
    this.routes = routes;
  }

  async start() {

    // Parsear body como JSON y como form-urlencoded
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Registrar todas las rutas de la aplicación
    this.app.use(this.routes);

    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });

  }

}