
// Adaptador de configuración: carga y valida las variables de entorno.
// env-var lanza un error descriptivo si falta alguna requerida, evitando que la
// app arranque con configuración incompleta.
//
// Este archivo NO debe ser importado nunca desde domain/: hace efectos
// (dotenv.config) al cargarse, y eso obligaría a tener un .env para correr los
// tests de dominio.
import { resolve } from 'node:path';
import { config } from 'dotenv';
import envVar from 'env-var';

config({ path: resolve(import.meta.dirname, '../.env') });

export const envs = {
  PORT: envVar.get('PORT').required().asPortNumber(),

  APP_NAME: envVar.get('APP_NAME').required().asString(),
};
