import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/infrastructure/prisma';
import { MessagingModule } from './shared/infrastructure/messaging';
import { IntervenantModule } from './modules/intervenant/intervenant.module';
import { MissionModule } from './modules/mission/mission.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    // Configuration globale - charge le fichier .env
    ConfigModule.forRoot({
      isGlobal: true, // Disponible partout sans ré-import
    }),

    // Base de données - PrismaModule est @Global, donc disponible partout
    PrismaModule,

    // Messaging - EventBus pour publier les Domain Events vers RabbitMQ
    MessagingModule,

    // Modules métier (bounded contexts)
    IntervenantModule,
    MissionModule,

    // Chatbot avec LangChain
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
