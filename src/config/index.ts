// Barrel de config. RESERVADO exclusivamente a la carga de entorno.
//
// Los wrappers de librerías externas (hashing, tokens, reloj) NO van aquí: van
// en infrastructure/adapters/, porque envolver una librería es el mismo trabajo
// que envolver una base de datos — una implementación concreta de un detalle.
export * from './envs.js';
