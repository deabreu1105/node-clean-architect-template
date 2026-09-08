
// CAPA: Domain | TIPO: Contrato (clase abstracta)
//
// Puerto hacia el entorno de ejecución. La capa interna declara QUÉ necesita
// saber; infrastructure decide CÓMO se averigua. Se usa clase abstracta en vez
// de interface para poder tiparla en tiempo de ejecución y extenderla desde la
// implementación concreta.

// Datos crudos del entorno. La entidad se compone en el use-case, no aquí: así
// el instante de la comprobación entra por el puerto Clock y el test puede
// fijarlo.
export interface HealthSnapshot {
  appName: string;
  uptimeSeconds: number;
  nodeVersion: string;
}

export abstract class HealthRepository {

  abstract getSnapshot(): HealthSnapshot;

}
