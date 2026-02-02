import { ValueObject } from '../../../../shared/domain';

/**
 * Rôles possibles pour un message dans une conversation
 */
export type MessageRoleType = 'user' | 'assistant' | 'tool';

/**
 * Props pour le Value Object MessageRole
 */
interface MessageRoleProps {
  value: MessageRoleType;
}

/**
 * MessageRole - Value Object représentant le rôle d'un message
 *
 * Rôles possibles:
 * - 'user': Message de l'utilisateur
 * - 'assistant': Réponse du chatbot
 * - 'tool': Résultat d'un tool call (fonction exécutée par l'agent)
 */
export class MessageRole extends ValueObject<MessageRoleProps> {
  private static readonly VALID_ROLES: MessageRoleType[] = [
    'user',
    'assistant',
    'tool',
  ];

  private constructor(props: MessageRoleProps) {
    super(props);
  }

  /**
   * Crée un MessageRole validé
   *
   * @throws Error si le rôle n'est pas valide
   */
  static create(role: string): MessageRole {
    const normalizedRole = role.toLowerCase().trim();

    if (!this.VALID_ROLES.includes(normalizedRole as MessageRoleType)) {
      throw new Error(
        `Invalid message role: ${role}. Must be one of: ${this.VALID_ROLES.join(', ')}`,
      );
    }

    return new MessageRole({ value: normalizedRole as MessageRoleType });
  }

  /**
   * Factory methods pour les rôles communs
   */
  static user(): MessageRole {
    return new MessageRole({ value: 'user' });
  }

  static assistant(): MessageRole {
    return new MessageRole({ value: 'assistant' });
  }

  static tool(): MessageRole {
    return new MessageRole({ value: 'tool' });
  }

  /**
   * Retourne la valeur du rôle
   */
  get value(): MessageRoleType {
    return this.props.value;
  }

  /**
   * Vérifie si c'est un message utilisateur
   */
  isUser(): boolean {
    return this.props.value === 'user';
  }

  /**
   * Vérifie si c'est une réponse assistant
   */
  isAssistant(): boolean {
    return this.props.value === 'assistant';
  }

  /**
   * Vérifie si c'est un résultat de tool
   */
  isTool(): boolean {
    return this.props.value === 'tool';
  }
}
