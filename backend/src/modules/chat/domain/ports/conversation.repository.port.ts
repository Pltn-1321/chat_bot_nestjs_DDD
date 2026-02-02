import { Conversation } from '../entities';
import { Message } from '../entities';

/**
 * ConversationRepository - PORT (Interface)
 *
 * Ce port définit le CONTRAT pour la persistance des Conversations.
 * Il fait partie du DOMAIN et ne connaît PAS Prisma.
 *
 * L'implémentation concrète (Adapter) sera dans la couche Infrastructure.
 */
export interface ConversationRepository {
  /**
   * Sauvegarde une conversation (création ou mise à jour)
   * L'ID est assigné automatiquement à la création (UUID)
   */
  save(conversation: Conversation): Promise<Conversation>;

  /**
   * Trouve une conversation par son ID avec tous ses messages
   * @returns null si non trouvée
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Retourne toutes les conversations (sans les messages complets)
   * Pour la liste des conversations
   */
  findAll(): Promise<Conversation[]>;

  /**
   * Supprime une conversation et tous ses messages
   */
  delete(id: string): Promise<void>;

  /**
   * Ajoute un message à une conversation existante
   * @returns Le message créé avec son ID
   */
  addMessage(conversationId: string, message: Message): Promise<Message>;
}

/**
 * Token d'injection pour NestJS
 */
export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
