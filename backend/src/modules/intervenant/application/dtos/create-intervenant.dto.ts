import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CreateIntervenantDto - Données pour créer un intervenant
 *
 * Les décorateurs class-validator sont utilisés pour la validation automatique.
 * NestJS valide ce DTO avant d'appeler le controller si ValidationPipe est activé.
 */
export class CreateIntervenantDto {
  @ApiProperty({
    description: 'Nom complet de l\'intervenant',
    example: 'Jean Dupont',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit avoir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom: string;

  @ApiProperty({
    description: 'Adresse email unique de l\'intervenant',
    example: 'jean.dupont@email.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Format d\'email invalide' })
  email: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '0612345678',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  telephone?: string;

  @ApiProperty({
    description: 'Domaine d\'expertise de l\'intervenant',
    example: 'NestJS',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'La spécialité doit être une chaîne de caractères' })
  @MinLength(2, { message: 'La spécialité doit avoir au moins 2 caractères' })
  @MaxLength(50, { message: 'La spécialité ne peut pas dépasser 50 caractères' })
  specialite: string;
}
