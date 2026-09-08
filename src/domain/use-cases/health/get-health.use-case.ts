
import { HealthStatusEntity } from '../../entities/health-status.entity.js';
import type { Clock } from '../../interfaces/clock.interface.js';
import type { HealthRepository } from '../../repositories/health.repository.js';

// CAPA: Domain | TIPO: UseCase
//
// Una clase, un trabajo. Sus dos dependencias entran por constructor y son
// REQUERIDAS, sin valor por defecto: poner aquí un `= new SystemClockAdapter()`
// obligaría a domain a importar infrastructure y rompería la Regla de
// Dependencia (checkpoint C4).

interface GetHealthUseCase {
  execute(): HealthStatusEntity;
}

export class GetHealth implements GetHealthUseCase {

  constructor(
    private readonly healthRepository: HealthRepository,
    private readonly clock: Clock,
  ) {}

  execute(): HealthStatusEntity {
    const snapshot = this.healthRepository.getSnapshot();

    return new HealthStatusEntity(
      'ok',
      snapshot.appName,
      snapshot.uptimeSeconds,
      snapshot.nodeVersion,
      this.clock(),
    );
  }

}
