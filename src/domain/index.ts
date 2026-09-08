// Barrel del domain.
// Centraliza las exportaciones para que infrastructure y presentation importen
// desde '../../domain/index.js' sin conocer la estructura interna.
//
// Ojo al crecer: importar el barrel carga TODO lo que reexporta. Si algún día
// una pieza de aquí ejecuta algo al importarse, se convierte en una carga
// ansiosa para todos sus consumidores. Usa `export type` donde solo sea un tipo.

export * from './validators.js';
export * from './errors/custom.error.js';
export * from './entities/health-status.entity.js';
export * from './dtos/health/health-query.dto.js';
export * from './repositories/health.repository.js';
export * from './use-cases/health/get-health.use-case.js';
export type * from './interfaces/clock.interface.js';
