import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis lorsqu'une mission est supprimée
 */
export class MissionDeletedEvent extends DomainEvent {
  constructor(
    public readonly missionId: number,
    public readonly titre: string,
  ) {
    super();
  }
}
