
// Adaptador de configuración: carga y valida las variables de entorno.
// env-var lanza un error descriptivo si alguna variable requerida no está definida,
// evitando que la app inicie con configuración incompleta.
import { resolve } from 'node:path';
import { config } from 'dotenv';
import envVar from 'env-var';

config({ path: resolve(import.meta.dirname, '../.env') });

export const envs = {
  PORT: envVar.get('PORT').required().asPortNumber(),

  MONGO_URL: envVar.get('MONGO_URL').required().asString(),

  MONGO_DB_NAME: envVar.get('MONGO_DB_NAME').required().asString(),

  JWT_SEED: envVar.get('JWT_SEED').required().asString(),

};
