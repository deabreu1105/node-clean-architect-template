
// CAPA: Domain | TIPO: Entity
//
// Representación interna del estado del servicio. Lo que sale por la red NO es
// esta entidad, sino el resultado de toPublic(): esa es la frontera de salida
// (checkpoint C6). Aquí la diferencia es solo verbosidad, pero el patrón es el
// mismo que impide filtrar un hash de contraseña en una entidad de usuario.

export interface PublicHealth {
  status: 'ok';
  appName: string;
}

export interface PublicHealthVerbose extends PublicHealth {
  uptimeSeconds: number;
  nodeVersion: string;
  checkedAt: string;
}

export class HealthStatusEntity {

  constructor(
    public readonly status: 'ok',
    public readonly appName: string,
    public readonly uptimeSeconds: number,
    public readonly nodeVersion: string,
    public readonly checkedAt: Date,
  ) {}

  // ÚNICA forma sancionada de poner este estado en el cable. Nunca serialices la
  // entidad directamente.
  toPublic( verbose: boolean ): PublicHealth | PublicHealthVerbose {
    const base: PublicHealth = { status: this.status, appName: this.appName };
    if ( !verbose ) return base;
    return {
      ...base,
      uptimeSeconds: this.uptimeSeconds,
      nodeVersion: this.nodeVersion,
      checkedAt: this.checkedAt.toISOString(),
    };
  }

}
