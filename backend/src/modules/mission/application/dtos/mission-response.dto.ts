import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Mission } from '../../domain';

/**
 * MissionResponseDto - Format de réponse pour l'API
 */
export class MissionResponseDto {
  @ApiProperty({ description: 'Identifiant unique', example: 1 })
  id: number;

  @ApiProperty({ description: 'Titre de la mission', example: 'Formation NestJS' })
  titre: string;

  @ApiProperty({ description: 'Date et heure', example: '2024-03-15T09:00:00.000Z' })
  date: Date;

  @ApiProperty({ description: 'Durée en minutes', example: 240 })
  duree: number;

  @ApiProperty({ description: 'Durée formatée', example: '4h' })
  dureeFormatted: string;

  @ApiProperty({ description: 'Lieu', example: 'Paris - Salle 201' })
  lieu: string;

  @ApiPropertyOptional({ description: 'ID de l\'intervenant assigné', example: 1, nullable: true })
  intervenantId: number | null;

  @ApiProperty({ description: 'Mission assignée à un intervenant', example: true })
  isAssigned: boolean;

  @ApiProperty({ description: 'Date de création', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Mission): MissionResponseDto {
    const dto = new MissionResponseDto();
    dto.id = entity.id;
    dto.titre = entity.titre;
    dto.date = entity.date;
    dto.duree = entity.duree.value;
    dto.dureeFormatted = entity.duree.toString();
    dto.lieu = entity.lieu.value;
    dto.intervenantId = entity.intervenantId;
    dto.isAssigned = entity.isAssigned;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Mission[]): MissionResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity));
  }
}
