import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { LangChainAgentService } from '../../infrastructure/ai/langchain-agent.service';
import { SendMessageDto } from '../dtos/send-message.dto';
import {
  SendMessageResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
  ToolResultDto,
} from '../dtos/chat-response.dto';

/**
 * ChatService - Couche Application
 *
 * Orchestre les conversations avec le chatbot:
 * - Gère la persistance des conversations (Prisma)
 * - Délègue le traitement des messages à l'agent LangChain
 * - Formate les réponses pour l'API
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: LangChainAgentService,
  ) {}

  /**
   * Envoie un message au chatbot et retourne la réponse
   */
  async sendMessage(
    dto: SendMessageDto,
    conversationId?: string,
  ): Promise<SendMessageResponseDto> {
    this.logger.debug(`Message reçu: "${dto.message.slice(0, 50)}..."`);

    // 1. Créer ou récupérer la conversation
    let conversation = conversationId
      ? await this.prisma.client.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!conversation) {
      // Créer une nouvelle conversation
      conversation = await this.prisma.client.conversation.create({
        data: {
          title: dto.message.slice(0, 50), // Titre = début du premier message
        },
        include: { messages: true },
      });
      this.logger.debug(`Nouvelle conversation créée: ${conversation.id}`);
    }

    // 2. Sauvegarder le message utilisateur
    const userMessage = await this.prisma.client.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: dto.message,
      },
    });

    // 3. Construire l'historique pour l'agent
    const chatHistory = conversation.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
      }));

    // 4. Invoquer l'agent LangChain
    const agentResponse = await this.agentService.invoke(
      dto.message,
      chatHistory,
    );

    // 5. Extraire les résultats des tools
    const toolResults: ToolResultDto[] = (agentResponse.intermediateSteps || []).map(
      (step) => {
        // Parser le résultat JSON du tool
        let parsed: { success: boolean; data?: unknown; error?: string };
        try {
          parsed = JSON.parse(step.output);
        } catch {
          parsed = { success: true, data: step.output };
        }

        return {
          tool: step.tool,
          success: parsed.success,
          data: parsed.data,
          error: parsed.error,
        };
      },
    );

    // 6. Sauvegarder la réponse de l'assistant
    // Convertir toolResults en JSON compatible Prisma
    const toolCallsJson: Prisma.InputJsonValue | undefined =
      toolResults.length > 0
        ? JSON.parse(JSON.stringify(toolResults))
        : undefined;

    const assistantMessage = await this.prisma.client.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: agentResponse.output,
        toolCalls: toolCallsJson,
      },
    });

    // 7. Construire la réponse
    const response: MessageResponseDto = {
      id: assistantMessage.id,
      role: 'assistant',
      content: assistantMessage.content,
      toolCalls: toolResults.length > 0
        ? toolResults.map((tr) => ({
            id: `${tr.tool}-${Date.now()}`,
            name: tr.tool,
            arguments: {},
          }))
        : undefined,
      createdAt: assistantMessage.createdAt,
    };

    return {
      conversationId: conversation.id,
      response,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    };
  }

  /**
   * Récupère toutes les conversations
   */
  async getConversations(): Promise<ConversationResponseDto[]> {
    const conversations = await this.prisma.client.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Juste le premier message pour l'aperçu
        },
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'tool',
        content: m.content,
        createdAt: m.createdAt,
      })),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  }

  /**
   * Récupère une conversation avec tous ses messages
   */
  async getConversation(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.client.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} non trouvée`);
    }

    return {
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'tool',
        content: m.content,
        toolCalls: m.toolCalls as any,
        createdAt: m.createdAt,
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const conversation = await this.prisma.client.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} non trouvée`);
    }

    // Les messages sont supprimés en cascade (onDelete: Cascade)
    await this.prisma.client.conversation.delete({ where: { id } });
    this.logger.debug(`Conversation ${id} supprimée`);
  }
}
