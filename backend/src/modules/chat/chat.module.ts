import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntervenantModule } from '../intervenant/intervenant.module';
import { MissionModule } from '../mission/mission.module';
import { PrismaModule } from '../../shared/infrastructure/prisma';

// Domain Ports
import { CONVERSATION_REPOSITORY, AI_AGENT } from './domain';

// Infrastructure Adapters
import { PrismaConversationRepository } from './infrastructure/adapters/prisma-conversation.adapter';
import { LangChainAgentAdapter } from './infrastructure/ai/langchain-agent.service';

// Application Services
import { ChatService } from './application/services/chat.service';

// Presentation
import { ChatController } from './presentation/chat.controller';

/**
 * ChatModule - Module de chatbot avec LangChain
 *
 * Architecture Hexagonale:
 * - Les PORTS sont définis dans domain/ports/
 * - Les ADAPTERS sont dans infrastructure/adapters/
 * - Les bindings Port → Adapter sont configurés ci-dessous
 *
 * Ce module intègre:
 * - ConversationRepository Port → PrismaConversationRepository Adapter
 * - AIAgent Port → LangChainAgentAdapter Adapter
 * - ChatService: Orchestration (dépend uniquement des ports)
 * - ChatController: API REST
 *
 * Dépendances:
 * - IntervenantModule: Pour les tools de gestion des intervenants
 * - MissionModule: Pour les tools de gestion des missions
 * - PrismaModule: Pour l'accès base de données
 * - ConfigModule: Pour la configuration OpenRouter
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    IntervenantModule, // Export IntervenantService (utilisé par LangChain tools)
    MissionModule,     // Export MissionService (utilisé par LangChain tools)
  ],
  controllers: [ChatController],
  providers: [
    // ============================================
    // BINDINGS: Port → Adapter
    // Architecture Hexagonale: on injecte les interfaces,
    // et NestJS fournit les implémentations concrètes
    // ============================================

    // ConversationRepository Port → Prisma Adapter
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PrismaConversationRepository,
    },

    // AIAgent Port → LangChain Adapter
    {
      provide: AI_AGENT,
      useClass: LangChainAgentAdapter,
    },

    // ============================================
    // APPLICATION SERVICES
    // Ces services dépendent des ports (interfaces),
    // pas des adapters directement
    // ============================================
    ChatService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
