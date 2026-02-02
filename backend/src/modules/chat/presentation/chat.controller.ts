import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from '../application/services/chat.service';
import { SendMessageDto } from '../application/dtos/send-message.dto';
import {
  SendMessageResponseDto,
  ConversationResponseDto,
} from '../application/dtos/chat-response.dto';

/**
 * ChatController - Couche Présentation
 *
 * Expose les endpoints REST pour interagir avec le chatbot.
 */
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Envoyer un message au chatbot
   */
  @Post('message')
  @ApiOperation({
    summary: 'Envoyer un message au chatbot',
    description:
      'Envoie un message au chatbot et reçoit une réponse. Si conversationId est fourni, continue la conversation existante.',
  })
  @ApiQuery({
    name: 'conversationId',
    required: false,
    description: 'ID de la conversation existante (optionnel)',
  })
  @ApiResponse({
    status: 200,
    description: 'Réponse du chatbot',
    type: SendMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Message invalide',
  })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Query('conversationId') conversationId?: string,
  ): Promise<SendMessageResponseDto> {
    return this.chatService.sendMessage(dto, conversationId);
  }

  /**
   * Lister toutes les conversations
   */
  @Get('conversations')
  @ApiOperation({
    summary: 'Lister toutes les conversations',
    description: 'Récupère la liste de toutes les conversations avec un aperçu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des conversations',
    type: [ConversationResponseDto],
  })
  async getConversations(): Promise<ConversationResponseDto[]> {
    return this.chatService.getConversations();
  }

  /**
   * Récupérer une conversation
   */
  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Récupérer une conversation',
    description: 'Récupère une conversation avec tous ses messages.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation trouvée',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation non trouvée',
  })
  async getConversation(
    @Param('id') id: string,
  ): Promise<ConversationResponseDto> {
    return this.chatService.getConversation(id);
  }

  /**
   * Supprimer une conversation
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une conversation',
    description: 'Supprime une conversation et tous ses messages.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la conversation à supprimer',
  })
  @ApiResponse({
    status: 204,
    description: 'Conversation supprimée',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation non trouvée',
  })
  async deleteConversation(@Param('id') id: string): Promise<void> {
    return this.chatService.deleteConversation(id);
  }
}
