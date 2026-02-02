import { DomainEvent } from '../../../../shared/domain';
import { MessageRoleType } from '../value-objects';

/**
 * MessageSentEvent - Émis quand un message est envoyé dans une conversation
 */
export class MessageSentEvent extends DomainEvent {
  constructor(
    public readonly conversationId: string,
    public readonly messageId: string,
    public readonly role: MessageRoleType,
    public readonly contentPreview: string,
  ) {
    super();
    // Tronquer le preview pour ne pas surcharger les events
    this.contentPreview = contentPreview.slice(0, 100);
  }
}
