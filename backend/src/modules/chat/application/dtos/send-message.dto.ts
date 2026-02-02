import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO pour envoyer un message au chatbot
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Message à envoyer au chatbot',
    example: 'Liste tous les intervenants',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1, { message: 'Le message ne peut pas être vide' })
  @MaxLength(2000, { message: 'Le message ne peut pas dépasser 2000 caractères' })
  message: string;
}
