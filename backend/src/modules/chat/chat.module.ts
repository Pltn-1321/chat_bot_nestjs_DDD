import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntervenantModule } from '../intervenant/intervenant.module';
import { MissionModule } from '../mission/mission.module';
import { LangChainAgentService } from './infrastructure/ai/langchain-agent.service';
import { ChatService } from './application/services/chat.service';
import { ChatController } from './presentation/chat.controller';

/**
 * ChatModule - Module de chatbot avec LangChain
 *
 * Ce module intègre:
 * - LangChainAgentService: Agent IA avec tools
 * - ChatService: Orchestration et persistance
 * - ChatController: API REST
 *
 * Dépendances:
 * - IntervenantModule: Pour les tools de gestion des intervenants
 * - MissionModule: Pour les tools de gestion des missions
 * - ConfigModule: Pour la configuration OpenRouter
 */
@Module({
  imports: [
    ConfigModule,
    IntervenantModule, // Export IntervenantService
    MissionModule,     // Export MissionService
  ],
  controllers: [ChatController],
  providers: [
    LangChainAgentService,
    ChatService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
