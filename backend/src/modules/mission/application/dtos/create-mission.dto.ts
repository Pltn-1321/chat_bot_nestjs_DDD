import {
  IsString,
  IsInt,
  IsDate,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CreateMissionDto - Données pour créer une mission
 */
export class CreateMissionDto {
  @ApiProperty({
    description: 'Titre de la mission',
    example: 'Formation NestJS avancé',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le titre doit avoir au moins 3 caractères' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  titre: string;

  @ApiProperty({
    description: 'Date et heure de la mission (ISO 8601)',
    example: '2024-03-15T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Type(() => Date) // Transforme la string ISO en Date
  @IsDate({ message: 'La date doit être une date valide' })
  date: Date;

  @ApiProperty({
    description: 'Durée en minutes (15-480)',
    example: 240,
    minimum: 15,
    maximum: 480,
  })
  @IsInt({ message: 'La durée doit être un nombre entier' })
  @Min(15, { message: 'La durée minimum est de 15 minutes' })
  @Max(480, { message: 'La durée maximum est de 480 minutes (8h)' })
  duree: number;

  @ApiProperty({
    description: 'Lieu de la mission',
    example: 'Paris - Salle 201',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Le lieu doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le lieu doit avoir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le lieu ne peut pas dépasser 100 caractères' })
  lieu: string;

  @ApiPropertyOptional({
    description: 'ID de l\'intervenant à assigner (optionnel)',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "L'ID de l'intervenant doit être un nombre entier" })
  intervenantId?: number;
}
