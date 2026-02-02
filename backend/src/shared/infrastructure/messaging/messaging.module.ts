import { Global, Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../../domain';
import { RabbitMQEventPublisher } from './event-bus.service';
import { EventLoggerConsumer } from './event-logger.consumer';

/**
 * MessagingModule - Infrastructure RabbitMQ
 *
 * Module global qui fournit:
 * - EVENT_PUBLISHER: Port pour publier des Domain Events
 *   (implémenté par RabbitMQEventPublisher)
 * - EventLoggerConsumer: pour logger tous les events (debug)
 *
 * Architecture Hexagonale:
 * - Le Port EVENT_PUBLISHER est défini dans shared/domain/ports/
 * - L'Adapter RabbitMQEventPublisher implémente ce port
 * - Les services injectent @Inject(EVENT_PUBLISHER) et reçoivent l'adapter
 *
 * @Global permet d'injecter EVENT_PUBLISHER partout sans ré-import
 */
@Global()
@Module({
  providers: [
    // Binding: Port → Adapter
    // Quand on demande EVENT_PUBLISHER, on reçoit RabbitMQEventPublisher
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQEventPublisher,
    },
    // Consumer pour debug (log tous les events)
    EventLoggerConsumer,
  ],
  exports: [EVENT_PUBLISHER],
})
export class MessagingModule {}
