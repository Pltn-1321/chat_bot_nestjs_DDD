import { randomUUID } from 'crypto';

/**
 * DomainEvent - Classe de base pour tous les événements du domaine
 *
 * Un Domain Event représente quelque chose d'important qui s'est passé
 * dans le domaine métier. C'est un fait passé, donc immutable.
 *
 * Caractéristiques:
 * - Immutable (décrit un fait passé)
 * - Contient un timestamp (quand c'est arrivé)
 * - Contient un ID unique pour traçabilité
 * - Nommé au passé (IntervenantCreated, MissionAssigned)
 *
 * @example
 * class IntervenantCreatedEvent extends DomainEvent {
 *   constructor(
 *     public readonly intervenantId: string,
 *     public readonly email: string,
 *   ) {
 *     super();
 *   }
 * }
 */
export abstract class DomainEvent {
  /** Identifiant unique de l'événement */
  public readonly eventId: string;

  /** Date et heure où l'événement s'est produit */
  public readonly occurredAt: Date;

  /** Nom de l'événement (utilisé pour le routing) */
  public readonly eventName: string;

  protected constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    // Le nom de l'événement est le nom de la classe
    this.eventName = this.constructor.name;
  }
}
