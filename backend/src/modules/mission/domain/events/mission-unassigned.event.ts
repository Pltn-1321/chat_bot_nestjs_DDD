import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis lorsqu'un intervenant est retiré d'une mission
 */
export class MissionUnassignedEvent extends DomainEvent {
  constructor(
    public readonly missionId: number,
    public readonly previousIntervenantId: number,
  ) {
    super();
  }
}
