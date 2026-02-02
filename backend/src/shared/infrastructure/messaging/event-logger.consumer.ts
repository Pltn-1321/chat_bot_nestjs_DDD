import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { EventBusService } from './event-bus.service';

/**
 * EventLoggerConsumer - Log tous les Domain Events
 *
 * S'abonne avec le pattern "#" pour recevoir TOUS les events.
 * Utile pour:
 * - Debug et monitoring
 * - Audit trail
 * - Comprendre le flow des events
 */
@Injectable()
export class EventLoggerConsumer implements OnModuleInit {
  private readonly logger = new Logger(EventLoggerConsumer.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  // Queue dédiée à ce consumer
  private readonly QUEUE_NAME = 'event-logger';
  // Pattern "#" = tous les events
  private readonly BINDING_PATTERN = '#';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!rabbitUrl) {
      this.logger.warn('RABBITMQ_URL non configuré - Consumer désactivé');
      return;
    }

    this.connection = amqp.connect([rabbitUrl]);

    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: Channel) => {
        // Créer la queue (durable = survit aux redémarrages)
        await channel.assertQueue(this.QUEUE_NAME, { durable: true });

        // Lier la queue à l'exchange avec le pattern
        await channel.bindQueue(
          this.QUEUE_NAME,
          EventBusService.EXCHANGE_NAME,
          this.BINDING_PATTERN,
        );

        // Commencer à consommer les messages
        await channel.consume(this.QUEUE_NAME, (msg) => {
          if (msg) {
            this.handleMessage(msg, channel);
          }
        });

        this.logger.log(
          `👂 EventLogger écoute sur "${this.QUEUE_NAME}" (pattern: ${this.BINDING_PATTERN})`,
        );
      },
    });
  }

  private handleMessage(msg: ConsumeMessage, channel: Channel): void {
    try {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      // Log formaté pour lisibilité
      this.logger.log(
        `\n` +
          `┌─────────────────────────────────────────────\n` +
          `│ 📨 EVENT REÇU: ${routingKey}\n` +
          `├─────────────────────────────────────────────\n` +
          `│ ID: ${content.eventId}\n` +
          `│ Date: ${content.occurredAt}\n` +
          `│ Data: ${JSON.stringify(content, null, 2).split('\n').join('\n│ ')}\n` +
          `└─────────────────────────────────────────────`,
      );

      // Acknowledge le message (dire à RabbitMQ qu'on l'a traité)
      channel.ack(msg);
    } catch (error) {
      this.logger.error(`Erreur traitement message: ${error.message}`);
      // Rejeter le message (ne pas le remettre en queue)
      channel.nack(msg, false, false);
    }
  }
}
