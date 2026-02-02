import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Intervenant } from '../../domain';

/**
 * IntervenantResponseDto - Format de réponse pour l'API
 *
 * Convertit une Entity Domain en objet simple pour l'API.
 * Cela évite d'exposer la structure interne de l'Entity.
 */
export class IntervenantResponseDto {
  @ApiProperty({ description: 'Identifiant unique', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nom complet', example: 'Jean Dupont' })
  nom: string;

  @ApiProperty({ description: 'Adresse email', example: 'jean.dupont@email.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone', example: '0612345678', nullable: true })
  telephone: string | null;

  @ApiProperty({ description: 'Domaine d\'expertise', example: 'NestJS' })
  specialite: string;

  @ApiProperty({ description: 'Date de création', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  /**
   * Factory method pour créer un DTO depuis une Entity
   */
  static fromEntity(entity: Intervenant): IntervenantResponseDto {
    const dto = new IntervenantResponseDto();
    dto.id = entity.id;
    dto.nom = entity.nom;
    dto.email = entity.email.value; // Extrait la valeur du Value Object
    dto.telephone = entity.telephone;
    dto.specialite = entity.specialite.value;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  /**
   * Convertit une liste d'entities en liste de DTOs
   */
  static fromEntities(entities: Intervenant[]): IntervenantResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity));
  }
}
