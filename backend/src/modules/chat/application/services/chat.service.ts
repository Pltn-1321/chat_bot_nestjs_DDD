import { Injectable, Inject, Logger } from '@nestjs/common';
import type { EventPublisher } from '../../../../shared/domain';
import {
  EntityNotFoundException,
  EVENT_PUBLISHER,
} from '../../../../shared/domain';
import type { ConversationRepository, AIAgent } from '../../domain';
import {
  Conversation,
  CONVERSATION_REPOSITORY,
  AI_AGENT,
  ToolCall,
} from '../../domain';
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
 * Architecture Hexagonale:
 * - Ce service dépend UNIQUEMENT des PORTS (interfaces)
 * - Il ne connaît pas Prisma, RabbitMQ, ou LangChain directement
 * - Les implémentations concrètes sont injectées via les tokens
 *
 * Responsabilités:
 * - Orchestrer les use cases pour les conversations
 * - Coordonner Domain et Infrastructure via les Ports
 * - Gérer les Domain Events
 * - Formater les réponses pour l'API
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
    @Inject(AI_AGENT)
    private readonly aiAgent: AIAgent,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Envoie un message au chatbot et retourne la réponse
   */
  async sendMessage(
    dto: SendMessageDto,
    conversationId?: string,
  ): Promise<SendMessageResponseDto> {
    this.logger.debug(`Message reçu: "${dto.message.slice(0, 50)}..."`);

    // 1. Récupérer ou créer la conversation
    let conversation: Conversation;

    if (conversationId) {
      const existing = await this.conversationRepository.findById(conversationId);
      if (existing) {
        conversation = existing;
      } else {
        // Créer une nouvelle conversation si l'ID fourni n'existe pas
        conversation = Conversation.create({
          title: dto.message.slice(0, 50),
        });
        conversation = await this.conversationRepository.save(conversation);
        this.logger.debug(`Nouvelle conversation créée: ${conversation.id}`);
      }
    } else {
      // Créer une nouvelle conversation
      conversation = Conversation.create({
        title: dto.message.slice(0, 50),
      });
      conversation = await this.conversationRepository.save(conversation);
      this.logger.debug(`Nouvelle conversation créée: ${conversation.id}`);
    }

    // 2. Ajouter le message utilisateur
    const userMessage = conversation.addUserMessage(dto.message);
    const savedUserMessage = await this.conversationRepository.addMessage(
      conversation.id,
      userMessage,
    );

    // 3. Récupérer l'historique pour l'agent
    const chatHistory = conversation.getChatHistory();

    // 4. Invoquer l'agent IA via le Port
    const agentResponse = await this.aiAgent.invoke(dto.message, chatHistory);

    // 5. Extraire les résultats des tools
    const toolResults: ToolResultDto[] = (agentResponse.intermediateSteps || []).map(
      (step) => {
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

    // 6. Ajouter la réponse assistant
    const toolCalls: ToolCall[] | undefined = toolResults.length > 0
      ? toolResults.map((tr) => ({
          id: `${tr.tool}-${Date.now()}`,
          name: tr.tool,
          arguments: {},
        }))
      : undefined;

    const assistantMessage = conversation.addAssistantMessage(
      agentResponse.output,
      toolCalls,
    );
    const savedAssistantMessage = await this.conversationRepository.addMessage(
      conversation.id,
      assistantMessage,
    );

    // 7. Publier les Domain Events
    await this.eventPublisher.publishAll(conversation.domainEvents);
    conversation.clearDomainEvents();

    // 8. Construire la réponse
    const response: MessageResponseDto = {
      id: savedAssistantMessage.id,
      role: 'assistant',
      content: savedAssistantMessage.content,
      toolCalls: toolCalls?.map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
      })),
      createdAt: savedAssistantMessage.createdAt,
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
    const conversations = await this.conversationRepository.findAll();

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role.value,
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
    const conversation = await this.conversationRepository.findById(id);

    if (!conversation) {
      throw new EntityNotFoundException('Conversation', id);
    }

    return {
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role.value,
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
    const conversation = await this.conversationRepository.findById(id);

    if (!conversation) {
      throw new EntityNotFoundException('Conversation', id);
    }

    await this.conversationRepository.delete(id);
    this.logger.debug(`Conversation ${id} supprimée`);
  }
}
