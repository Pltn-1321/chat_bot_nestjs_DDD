import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis quand un nouvel intervenant est créé
 *
 * Cet événement sera publié vers RabbitMQ pour:
 * - Envoyer un email de bienvenue
 * - Notifier les administrateurs
 * - Synchroniser avec d'autres systèmes
 */
export class IntervenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly intervenantId: number,
    public readonly nom: string,
    public readonly email: string,
    public readonly specialite: string,
  ) {
    super();
  }
}
