import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { EventLoggerConsumer } from './event-logger.consumer';

/**
 * MessagingModule - Infrastructure RabbitMQ
 *
 * Module global qui fournit:
 * - EventBusService: pour publier des Domain Events
 * - EventLoggerConsumer: pour logger tous les events (debug)
 *
 * @Global permet d'injecter EventBusService partout sans ré-import
 */
@Global()
@Module({
  providers: [EventBusService, EventLoggerConsumer],
  exports: [EventBusService],
})
export class MessagingModule {}
