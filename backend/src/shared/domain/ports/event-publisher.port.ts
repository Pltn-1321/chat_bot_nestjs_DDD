import { DomainEvent } from '../domain-event.base';

/**
 * EventPublisher - PORT (Interface)
 *
 * Ce port définit le CONTRAT pour la publication des Domain Events.
 * Il fait partie du DOMAIN et ne connaît PAS RabbitMQ, Kafka, ou autre.
 *
 * L'implémentation concrète (Adapter) sera dans la couche Infrastructure.
 *
 * Avantages:
 * - Le Domain/Application ne dépend pas de la technologie de messaging
 * - Facile à mocker pour les tests
 * - Permet de changer de broker (RabbitMQ → Kafka) sans toucher au Domain
 */
export interface EventPublisher {
  /**
   * Publie un Domain Event
   *
   * @param event - L'événement à publier
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publie plusieurs Domain Events (après un save par exemple)
   *
   * @param events - Les événements à publier
   */
  publishAll(events: readonly DomainEvent[]): Promise<void>;
}

/**
 * Token d'injection pour NestJS
 * Permet d'injecter l'interface plutôt que l'implémentation concrète
 *
 * Usage dans un service:
 *   constructor(
 *     @Inject(EVENT_PUBLISHER)
 *     private readonly eventPublisher: EventPublisher
 *   ) {}
 */
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
