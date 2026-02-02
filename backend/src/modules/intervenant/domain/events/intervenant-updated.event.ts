import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis quand un intervenant est mis à jour
 */
export class IntervenantUpdatedEvent extends DomainEvent {
  constructor(
    public readonly intervenantId: number,
    public readonly changedFields: string[], // Liste des champs modifiés
  ) {
    super();
  }
}
