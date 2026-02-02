import { Entity } from '../../../../shared/domain';
import { Message, CreateMessageProps, ToolCall } from './message.entity';
import { MessageRoleType } from '../value-objects';
import { ConversationCreatedEvent } from '../events/conversation-created.event';
import { MessageSentEvent } from '../events/message-sent.event';

/**
 * Props pour créer une nouvelle Conversation
 */
export interface CreateConversationProps {
  title?: string;
}

/**
 * Props pour reconstruire une Conversation depuis la BDD
 */
export interface ReconstructConversationProps {
  id: string;
  title: string | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation - Aggregate Root pour le module Chat
 *
 * Une Conversation contient une liste de Messages et gère
 * les invariants métier liés aux conversations.
 *
 * C'est l'Aggregate Root car:
 * - On accède toujours aux Messages via la Conversation
 * - Les règles métier sont vérifiées au niveau Conversation
 * - Les Domain Events sont émis par la Conversation
 */
export class Conversation extends Entity<string> {
  private _title: string | null;
  private _messages: Message[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    title: string | null,
    messages: Message[],
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._title = title;
    this._messages = messages;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  /**
   * Crée une nouvelle Conversation
   */
  static create(props: CreateConversationProps = {}): Conversation {
    const now = new Date();

    const conversation = new Conversation(
      '', // ID temporaire, sera assigné par la BDD
      props.title || null,
      [],
      now,
      now,
    );

    // Émettre l'événement de création
    conversation.addDomainEvent(new ConversationCreatedEvent(conversation.id));

    return conversation;
  }

  /**
   * Reconstruit une Conversation depuis la BDD
   */
  static reconstruct(props: ReconstructConversationProps): Conversation {
    return new Conversation(
      props.id,
      props.title,
      props.messages,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================
  // GETTERS
  // ==========================================

  get title(): string | null {
    return this._title;
  }

  get messages(): readonly Message[] {
    return this._messages;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ==========================================
  // MÉTHODES MÉTIER
  // ==========================================

  /**
   * Définit le titre de la conversation
   */
  setTitle(title: string): void {
    this._title = title.trim();
    this._updatedAt = new Date();
  }

  /**
   * Ajoute un message à la conversation
   * Cette méthode crée le Message et l'ajoute à la liste
   *
   * @returns Le Message créé
   */
  addMessage(props: CreateMessageProps): Message {
    const message = Message.create(this.id, props);
    this._messages.push(message);
    this._updatedAt = new Date();

    // Émettre un événement si c'est un message utilisateur ou assistant
    if (props.role === 'user' || props.role === 'assistant') {
      this.addDomainEvent(
        new MessageSentEvent(
          this.id,
          message.id,
          props.role,
          props.content || '',
        ),
      );
    }

    return message;
  }

  /**
   * Ajoute un message utilisateur
   */
  addUserMessage(content: string): Message {
    return this.addMessage({
      role: 'user',
      content,
    });
  }

  /**
   * Ajoute une réponse assistant
   */
  addAssistantMessage(content: string, toolCalls?: ToolCall[]): Message {
    return this.addMessage({
      role: 'assistant',
      content,
      toolCalls,
    });
  }

  /**
   * Retourne l'historique des messages pour l'agent IA
   * (uniquement les messages user et assistant)
   */
  getChatHistory(): Array<{ role: MessageRoleType; content: string }> {
    return this._messages
      .filter((m) => m.role.isUser() || m.role.isAssistant())
      .map((m) => ({
        role: m.role.value,
        content: m.content || '',
      }));
  }

  /**
   * Retourne le nombre de messages
   */
  messageCount(): number {
    return this._messages.length;
  }

  /**
   * Vérifie si la conversation est vide
   */
  isEmpty(): boolean {
    return this._messages.length === 0;
  }

  /**
   * Retourne le dernier message
   */
  lastMessage(): Message | null {
    if (this._messages.length === 0) {
      return null;
    }
    return this._messages[this._messages.length - 1];
  }
}
