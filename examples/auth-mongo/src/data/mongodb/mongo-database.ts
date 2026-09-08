import mongoose from "mongoose";


interface Options {
  mongoUrl: string;
  dbName: string;
}


// Maneja el ciclo de vida de la conexión a MongoDB.
// Vive en data/ porque es un detalle de infraestructura, no una regla de negocio.
export class MongoDatabase {

  // connect es estático: no se necesita instanciar la clase para conectar.
  // Si mongoose.connect falla, relanza el error para que app.ts lo capture
  // y detenga el proceso antes de levantar el servidor.
  static async connect(options: Options) {

    const { mongoUrl, dbName } = options;

    try {
      await mongoose.connect(mongoUrl, { dbName: dbName });
      console.log('Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('Error connecting to MongoDB', error);
      throw error;
    }

  }

  static async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB', error);
    }
  }

}