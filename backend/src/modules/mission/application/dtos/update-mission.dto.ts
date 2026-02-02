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
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * UpdateMissionDto - Données pour mettre à jour une mission
 */
export class UpdateMissionDto {
  @ApiPropertyOptional({
    description: 'Titre de la mission',
    example: 'Formation NestJS avancé',
  })
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le titre doit avoir au moins 3 caractères' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  titre?: string;

  @ApiPropertyOptional({
    description: 'Date et heure de la mission (ISO 8601)',
    example: '2024-03-15T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La date doit être une date valide' })
  date?: Date;

  @ApiPropertyOptional({
    description: 'Durée en minutes (15-480)',
    example: 180,
  })
  @IsOptional()
  @IsInt({ message: 'La durée doit être un nombre entier' })
  @Min(15, { message: 'La durée minimum est de 15 minutes' })
  @Max(480, { message: 'La durée maximum est de 480 minutes (8h)' })
  duree?: number;

  @ApiPropertyOptional({
    description: 'Lieu de la mission',
    example: 'Lyon - Amphithéâtre',
  })
  @IsOptional()
  @IsString({ message: 'Le lieu doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le lieu doit avoir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le lieu ne peut pas dépasser 100 caractères' })
  lieu?: string;
}
