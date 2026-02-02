import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * UpdateIntervenantDto - Données pour mettre à jour un intervenant
 *
 * Tous les champs sont optionnels car on peut ne modifier qu'un seul champ.
 * Seuls les champs fournis seront mis à jour.
 */
export class UpdateIntervenantDto {
  @ApiPropertyOptional({
    description: 'Nom complet de l\'intervenant',
    example: 'Jean Dupont',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit avoir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom?: string;

  @ApiPropertyOptional({
    description: 'Adresse email unique',
    example: 'jean.dupont@email.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format d\'email invalide' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone (null pour supprimer)',
    example: '0612345678',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  telephone?: string | null;

  @ApiPropertyOptional({
    description: 'Domaine d\'expertise',
    example: 'React',
  })
  @IsOptional()
  @IsString({ message: 'La spécialité doit être une chaîne de caractères' })
  @MinLength(2, { message: 'La spécialité doit avoir au moins 2 caractères' })
  @MaxLength(50, { message: 'La spécialité ne peut pas dépasser 50 caractères' })
  specialite?: string;
}
