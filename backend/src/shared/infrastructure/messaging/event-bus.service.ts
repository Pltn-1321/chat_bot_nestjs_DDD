import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainEvent, EventPublisher } from '../../domain';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';

/**
 * RabbitMQEventPublisher - ADAPTER qui implémente le Port EventPublisher
 *
 * Cet adapter implémente l'interface EventPublisher du Domain
 * en utilisant RabbitMQ comme broker de messages.
 *
 * Architecture Hexagonale:
 * - Le Port (EventPublisher) est dans shared/domain/ports/
 * - Cet Adapter est dans shared/infrastructure/messaging/
 * - Les services Application injectent le PORT, pas cet adapter directement
 *
 * Utilise un Topic Exchange pour permettre le routing par pattern:
 * - intervenant.created
 * - mission.assigned
 * - etc.
 *
 * Les consumers peuvent s'abonner avec des patterns:
 * - "#" → tous les events
 * - "mission.*" → tous les events mission
 * - "intervenant.created" → un event spécifique
 */
@Injectable()
export class RabbitMQEventPublisher implements EventPublisher, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQEventPublisher.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  // Nom de l'exchange où tous les events sont publiés
  static readonly EXCHANGE_NAME = 'domain.events';
  static readonly EXCHANGE_TYPE = 'topic';

  constructor(private readonly configService: ConfigService) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!rabbitUrl) {
      this.logger.warn('RABBITMQ_URL non configuré - EventBus désactivé');
      return;
    }

    // Connexion avec reconnexion automatique
    this.connection = amqp.connect([rabbitUrl], {
      heartbeatIntervalInSeconds: 30,
      reconnectTimeInSeconds: 5,
    });

    this.connection.on('connect', () => {
      this.logger.log('✅ Connecté à RabbitMQ');
    });

    this.connection.on('disconnect', ({ err }) => {
      this.logger.warn('⚠️ Déconnecté de RabbitMQ', err?.message || '');
    });

    // Créer un channel avec l'exchange configuré
    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: Channel) => {
        // Déclarer l'exchange (créé s'il n'existe pas)
        await channel.assertExchange(
          RabbitMQEventPublisher.EXCHANGE_NAME,
          RabbitMQEventPublisher.EXCHANGE_TYPE,
          { durable: true },
        );
        this.logger.log(
          `📢 Exchange "${RabbitMQEventPublisher.EXCHANGE_NAME}" prêt`,
        );
      },
    });
  }

  /**
   * Publie un Domain Event vers RabbitMQ
   *
   * @param event - L'événement à publier
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.channelWrapper) {
      this.logger.warn('EventBus non connecté - event ignoré');
      return;
    }

    // Convertir le nom de classe en routing key
    // IntervenantCreatedEvent → intervenant.created
    const routingKey = this.eventNameToRoutingKey(event.eventName);

    // Sérialiser l'event en JSON
    const payload = JSON.stringify({
      eventId: event.eventId,
      eventName: event.eventName,
      occurredAt: event.occurredAt,
      ...this.extractEventData(event),
    });

    try {
      await this.channelWrapper.publish(
        RabbitMQEventPublisher.EXCHANGE_NAME,
        routingKey,
        Buffer.from(payload),
        { contentType: 'application/json' } as any,
      );

      this.logger.debug(`📤 Event publié: ${routingKey}`);
    } catch (error) {
      this.logger.error(`Erreur publication event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publie plusieurs events (après un save par exemple)
   */
  async publishAll(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Convertit le nom de l'event en routing key
   * IntervenantCreatedEvent → intervenant.created
   */
  private eventNameToRoutingKey(eventName: string): string {
    // Enlever "Event" à la fin si présent
    const name = eventName.replace(/Event$/, '');

    // Convertir PascalCase en kebab-case avec points
    // IntervenantCreated → intervenant.created
    return name
      .replace(/([a-z])([A-Z])/g, '$1.$2')
      .toLowerCase();
  }

  /**
   * Extrait les données de l'event (exclut les props de base)
   */
  private extractEventData(event: DomainEvent): Record<string, unknown> {
    const { eventId, eventName, occurredAt, ...data } = event as any;
    return data;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.logger.log('Connexion RabbitMQ fermée');
    }
  }
}
