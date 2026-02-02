import { Entity } from '../../../../shared/domain';
import { MessageRole, MessageRoleType } from '../value-objects';

/**
 * Représente un appel de tool (fonction) fait par l'agent
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Props pour créer un nouveau Message
 */
export interface CreateMessageProps {
  role: MessageRoleType;
  content: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
}

/**
 * Props pour reconstruire un Message depuis la BDD
 */
export interface ReconstructMessageProps {
  id: string;
  conversationId: string;
  role: MessageRoleType;
  content: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
  createdAt: Date;
}

/**
 * Message - Entity représentant un message dans une conversation
 *
 * Un message peut être:
 * - Un message utilisateur (role: 'user')
 * - Une réponse de l'assistant (role: 'assistant')
 * - Un résultat de tool (role: 'tool')
 */
export class Message extends Entity<string> {
  private _conversationId: string;
  private _role: MessageRole;
  private _content: string | null;
  private _toolCalls: ToolCall[] | null;
  private _toolCallId: string | null;
  private _toolName: string | null;
  private _createdAt: Date;

  private constructor(
    id: string,
    conversationId: string,
    role: MessageRole,
    content: string | null,
    toolCalls: ToolCall[] | null,
    toolCallId: string | null,
    toolName: string | null,
    createdAt: Date,
  ) {
    super(id);
    this._conversationId = conversationId;
    this._role = role;
    this._content = content;
    this._toolCalls = toolCalls;
    this._toolCallId = toolCallId;
    this._toolName = toolName;
    this._createdAt = createdAt;
  }

  /**
   * Crée un nouveau Message (pas encore persisté)
   * ID sera assigné par la BDD (UUID)
   */
  static create(conversationId: string, props: CreateMessageProps): Message {
    const role = MessageRole.create(props.role);

    return new Message(
      '', // ID temporaire, sera assigné par la BDD
      conversationId,
      role,
      props.content,
      props.toolCalls || null,
      props.toolCallId || null,
      props.toolName || null,
      new Date(),
    );
  }

  /**
   * Reconstruit un Message depuis les données de la BDD
   */
  static reconstruct(props: ReconstructMessageProps): Message {
    return new Message(
      props.id,
      props.conversationId,
      MessageRole.create(props.role),
      props.content,
      props.toolCalls || null,
      props.toolCallId || null,
      props.toolName || null,
      props.createdAt,
    );
  }

  // ==========================================
  // GETTERS
  // ==========================================

  get conversationId(): string {
    return this._conversationId;
  }

  get role(): MessageRole {
    return this._role;
  }

  get content(): string | null {
    return this._content;
  }

  get toolCalls(): ToolCall[] | null {
    return this._toolCalls;
  }

  get toolCallId(): string | null {
    return this._toolCallId;
  }

  get toolName(): string | null {
    return this._toolName;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ==========================================
  // MÉTHODES MÉTIER
  // ==========================================

  /**
   * Vérifie si ce message a des tool calls
   */
  hasToolCalls(): boolean {
    return this._toolCalls !== null && this._toolCalls.length > 0;
  }

  /**
   * Vérifie si c'est un message utilisateur
   */
  isFromUser(): boolean {
    return this._role.isUser();
  }

  /**
   * Vérifie si c'est une réponse assistant
   */
  isFromAssistant(): boolean {
    return this._role.isAssistant();
  }
}
