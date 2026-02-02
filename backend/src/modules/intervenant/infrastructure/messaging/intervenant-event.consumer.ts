import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { EventBusService } from '../../../../shared/infrastructure/messaging';

/**
 * Payload reçu quand une mission est assignée
 */
interface MissionAssignedPayload {
  eventId: string;
  eventName: string;
  occurredAt: string;
  missionId: number;
  missionTitre: string;
  intervenantId: number;
  missionDate: string;
}

/**
 * IntervenantEventConsumer - Réagit aux events concernant les intervenants
 *
 * S'abonne aux events:
 * - mission.assigned → quand un intervenant est assigné à une mission
 * - mission.unassigned → quand un intervenant est retiré d'une mission
 *
 * C'est un exemple de communication CROSS-MODULE via events.
 * Le module Intervenant réagit aux actions du module Mission.
 */
@Injectable()
export class IntervenantEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(IntervenantEventConsumer.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  private readonly QUEUE_NAME = 'intervenant-events';
  // Pattern pour recevoir mission.assigned ET mission.unassigned
  private readonly BINDING_PATTERNS = ['mission.assigned', 'mission.unassigned'];

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
        await channel.assertQueue(this.QUEUE_NAME, { durable: true });

        // Bind pour chaque pattern
        for (const pattern of this.BINDING_PATTERNS) {
          await channel.bindQueue(
            this.QUEUE_NAME,
            EventBusService.EXCHANGE_NAME,
            pattern,
          );
        }

        await channel.consume(this.QUEUE_NAME, (msg) => {
          if (msg) {
            this.handleMessage(msg, channel);
          }
        });

        this.logger.log(
          `👂 IntervenantConsumer écoute: ${this.BINDING_PATTERNS.join(', ')}`,
        );
      },
    });
  }

  private handleMessage(msg: ConsumeMessage, channel: Channel): void {
    const routingKey = msg.fields.routingKey;

    try {
      const payload = JSON.parse(msg.content.toString());

      switch (routingKey) {
        case 'mission.assigned':
          this.handleMissionAssigned(payload as MissionAssignedPayload);
          break;
        case 'mission.unassigned':
          this.handleMissionUnassigned(payload);
          break;
        default:
          this.logger.warn(`Event non géré: ${routingKey}`);
      }

      channel.ack(msg);
    } catch (error) {
      this.logger.error(`Erreur traitement: ${error.message}`);
      channel.nack(msg, false, false);
    }
  }

  /**
   * Réagit à l'assignation d'un intervenant à une mission
   *
   * @param payload - Les données de l'event MissionAssigned
   */
  private handleMissionAssigned(payload: MissionAssignedPayload): void {
    // Formater la date en français
    const date = new Date(payload.missionDate);
    const dateFormatee = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Logger l'assignation
    this.logger.log(
      `🎯 Intervenant #${payload.intervenantId} assigné à "${payload.missionTitre}" le ${dateFormatee}`,
    );

    // Simuler l'envoi d'un email de notification
    this.logger.log(
      `📧 [Simulation] Email envoyé à l'intervenant #${payload.intervenantId}`,
    );
  }

  private handleMissionUnassigned(payload: any): void {
    this.logger.log(
      `🔓 Intervenant ${payload.intervenantId} retiré de la mission "${payload.missionTitre}"`,
    );
  }
}
