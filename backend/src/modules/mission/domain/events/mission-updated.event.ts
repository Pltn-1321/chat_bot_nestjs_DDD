import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis lorsqu'une mission est modifiée
 */
export class MissionUpdatedEvent extends DomainEvent {
  constructor(
    public readonly missionId: number,
    public readonly changedFields: string[],
  ) {
    super();
  }
}
