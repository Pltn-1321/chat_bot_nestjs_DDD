import {
  Conversation as PrismaConversation,
  Message as PrismaMessage,
} from '@prisma/client';
import { Conversation, Message, ToolCall } from '../../domain';
import { MessageRoleType } from '../../domain/value-objects';

/**
 * Type pour une conversation Prisma avec ses messages
 */
type PrismaConversationWithMessages = PrismaConversation & {
  messages: PrismaMessage[];
};

/**
 * ConversationMapper - Convertit entre Domain et Persistence
 *
 * Architecture Hexagonale:
 * - Le Domain ne connaît pas Prisma
 * - Ce mapper fait la traduction dans les deux sens
 */
export class ConversationMapper {
  /**
   * Convertit un Message Prisma vers le Domain
   */
  static messageToDomain(prismaMessage: PrismaMessage): Message {
    // Parser les toolCalls JSON si présent
    let toolCalls: ToolCall[] | undefined;
    if (prismaMessage.toolCalls) {
      try {
        toolCalls = prismaMessage.toolCalls as unknown as ToolCall[];
      } catch {
        toolCalls = undefined;
      }
    }

    return Message.reconstruct({
      id: prismaMessage.id,
      conversationId: prismaMessage.conversationId,
      role: prismaMessage.role as MessageRoleType,
      content: prismaMessage.content,
      toolCalls,
      toolCallId: prismaMessage.toolCallId,
      toolName: prismaMessage.toolName,
      createdAt: prismaMessage.createdAt,
    });
  }

  /**
   * Convertit une Conversation Prisma vers le Domain
   */
  static toDomain(prismaConv: PrismaConversationWithMessages): Conversation {
    const messages = prismaConv.messages.map((m) => this.messageToDomain(m));

    return Conversation.reconstruct({
      id: prismaConv.id,
      title: prismaConv.title,
      messages,
      createdAt: prismaConv.createdAt,
      updatedAt: prismaConv.updatedAt,
    });
  }

  /**
   * Convertit pour la création d'une Conversation en Prisma
   */
  static toPersistenceCreate(conversation: Conversation): {
    title: string | null;
  } {
    return {
      title: conversation.title,
    };
  }

  /**
   * Convertit un Message Domain pour création en Prisma
   */
  static messageToPersistenceCreate(message: Message): {
    role: string;
    content: string | null;
    toolCalls: unknown;
    toolCallId: string | null;
    toolName: string | null;
  } {
    return {
      role: message.role.value,
      content: message.content,
      toolCalls: message.toolCalls ? JSON.parse(JSON.stringify(message.toolCalls)) : null,
      toolCallId: message.toolCallId,
      toolName: message.toolName,
    };
  }
}
