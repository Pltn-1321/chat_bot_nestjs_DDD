import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { INTERVENANT_REPOSITORY } from './domain';
import { PrismaIntervenantRepository } from './infrastructure';
import { IntervenantEventConsumer } from './infrastructure/messaging/intervenant-event.consumer';
import { IntervenantService } from './application';
import { IntervenantController } from './presentation';

/**
 * IntervenantModule - Module NestJS pour le bounded context Intervenant
 *
 * Structure hexagonale:
 * - Domain: Entities, Value Objects, Repository Interface (PORT)
 * - Infrastructure: PrismaIntervenantRepository (ADAPTER), EventConsumer
 * - Application: IntervenantService (Use Cases)
 * - Presentation: IntervenantController (API REST)
 */
@Module({
  imports: [PrismaModule],
  controllers: [IntervenantController],
  providers: [
    // Infrastructure: PORT ↔ ADAPTER
    {
      provide: INTERVENANT_REPOSITORY,
      useClass: PrismaIntervenantRepository,
    },
    // Infrastructure: Event Consumer (réagit aux events RabbitMQ)
    IntervenantEventConsumer,
    // Application: Service
    IntervenantService,
  ],
  exports: [
    INTERVENANT_REPOSITORY,
    IntervenantService, // Permet aux autres modules d'utiliser le service
  ],
})
export class IntervenantModule {}
