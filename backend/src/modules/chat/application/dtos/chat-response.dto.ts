import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO représentant un appel de tool
 */
export class ToolCallDto {
  @ApiProperty({ description: "ID unique de l'appel de tool" })
  id: string;

  @ApiProperty({ description: 'Nom du tool appelé' })
  name: string;

  @ApiProperty({ description: 'Arguments passés au tool' })
  arguments: Record<string, unknown>;
}

/**
 * DTO représentant le résultat d'un tool
 */
export class ToolResultDto {
  @ApiProperty({ description: 'Nom du tool exécuté' })
  tool: string;

  @ApiProperty({ description: "Succès de l'exécution" })
  success: boolean;

  @ApiPropertyOptional({ description: 'Données retournées' })
  data?: unknown;

  @ApiPropertyOptional({ description: "Message d'erreur" })
  error?: string;
}

/**
 * DTO représentant un message dans la conversation
 */
export class MessageResponseDto {
  @ApiProperty({ description: 'ID unique du message' })
  id: string;

  @ApiProperty({
    description: 'Rôle du message',
    enum: ['user', 'assistant', 'tool'],
  })
  role: 'user' | 'assistant' | 'tool';

  @ApiPropertyOptional({ description: 'Contenu textuel du message' })
  content: string | null;

  @ApiPropertyOptional({
    description: 'Appels de tools (pour les messages assistant)',
    type: [ToolCallDto],
  })
  toolCalls?: ToolCallDto[];

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;
}

/**
 * DTO de réponse pour l'envoi d'un message
 */
export class SendMessageResponseDto {
  @ApiProperty({ description: 'ID de la conversation' })
  conversationId: string;

  @ApiProperty({
    description: "Réponse de l'assistant",
    type: MessageResponseDto,
  })
  response: MessageResponseDto;

  @ApiPropertyOptional({
    description: 'Résultats des tools exécutés',
    type: [ToolResultDto],
  })
  toolResults?: ToolResultDto[];
}

/**
 * DTO représentant une conversation complète
 */
export class ConversationResponseDto {
  @ApiProperty({ description: 'ID de la conversation' })
  id: string;

  @ApiPropertyOptional({ description: 'Titre de la conversation' })
  title: string | null;

  @ApiProperty({
    description: 'Messages de la conversation',
    type: [MessageResponseDto],
  })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updatedAt: Date;
}
