
// Barrel de config: variables de entorno cargadas desde .env a través del
// adaptador envs.ts. Los adaptadores sobre librerías externas (bcrypt, jwt)
// viven en infrastructure/adapters/, no aquí — config/ es solo configuración
// de entorno, no implementaciones concretas de detalles externos.
export * from './envs.js';
