import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { MISSION_REPOSITORY } from './domain';
import { PrismaMissionRepository } from './infrastructure';
import { MissionService } from './application';
import { MissionController } from './presentation';

/**
 * MissionModule - Module NestJS pour le bounded context Mission
 */
@Module({
  imports: [PrismaModule],
  controllers: [MissionController],
  providers: [
    {
      provide: MISSION_REPOSITORY,
      useClass: PrismaMissionRepository,
    },
    MissionService,
  ],
  exports: [MISSION_REPOSITORY, MissionService],
})
export class MissionModule {}
