import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma';
import {
  Conversation,
  Message,
  ConversationRepository,
} from '../../domain';
import { ConversationMapper } from '../mappers';

/**
 * PrismaConversationRepository - ADAPTER pour le Port ConversationRepository
 *
 * Architecture Hexagonale:
 * - Le Port (ConversationRepository) est défini dans domain/ports/
 * - Cet Adapter implémente le Port en utilisant Prisma
 * - Le ChatService injecte le PORT, pas cet adapter directement
 */
@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversation: Conversation): Promise<Conversation> {
    // Si pas d'ID, c'est une création
    if (!conversation.id) {
      const data = ConversationMapper.toPersistenceCreate(conversation);

      const created = await this.prisma.client.conversation.create({
        data,
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      return ConversationMapper.toDomain(created);
    }

    // Sinon, mise à jour
    const updated = await this.prisma.client.conversation.update({
      where: { id: conversation.id },
      data: {
        title: conversation.title,
        updatedAt: new Date(),
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return ConversationMapper.toDomain(updated);
  }

  async findById(id: string): Promise<Conversation | null> {
    const conversation = await this.prisma.client.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      return null;
    }

    return ConversationMapper.toDomain(conversation);
  }

  async findAll(): Promise<Conversation[]> {
    const conversations = await this.prisma.client.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Juste le premier message pour l'aperçu
        },
      },
    });

    return conversations.map((c) => ConversationMapper.toDomain(c));
  }

  async delete(id: string): Promise<void> {
    // Les messages sont supprimés en cascade (onDelete: Cascade dans le schema)
    await this.prisma.client.conversation.delete({
      where: { id },
    });
  }

  async addMessage(conversationId: string, message: Message): Promise<Message> {
    const data = ConversationMapper.messageToPersistenceCreate(message);

    const created = await this.prisma.client.message.create({
      data: {
        conversationId,
        ...data,
      },
    });

    return ConversationMapper.messageToDomain(created);
  }
}
