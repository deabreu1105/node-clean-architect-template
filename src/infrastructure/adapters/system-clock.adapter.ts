
// CAPA: Infrastructure | TIPO: Adapter
//
// Envuelve el reloj del sistema para satisfacer el puerto `Clock` de domain.
// Toda librería o API externa se envuelve en un adapter como este en vez de
// llamarse en línea desde otro sitio.
import type { Clock } from '../../domain/index.js';

export const systemClock: Clock = () => new Date();
