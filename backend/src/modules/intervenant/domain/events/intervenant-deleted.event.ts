import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis quand un intervenant est supprimé
 */
export class IntervenantDeletedEvent extends DomainEvent {
  constructor(
    public readonly intervenantId: number,
    public readonly email: string, // Pour identifier dans les logs
  ) {
    super();
  }
}
