import { DomainEvent } from '../../../../shared/domain';

/**
 * ConversationCreatedEvent - Émis quand une nouvelle conversation est créée
 */
export class ConversationCreatedEvent extends DomainEvent {
  constructor(public readonly conversationId: string) {
    super();
  }
}
