import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis lorsqu'une nouvelle mission est créée
 *
 * eventName sera automatiquement "MissionCreatedEvent"
 * (défini par la classe de base DomainEvent)
 */
export class MissionCreatedEvent extends DomainEvent {
  constructor(
    public readonly missionId: number,
    public readonly titre: string,
    public readonly date: Date,
    public readonly dureeMinutes: number,
    public readonly lieu: string,
  ) {
    super();
  }
}
