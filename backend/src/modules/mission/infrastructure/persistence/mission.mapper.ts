import { Mission as PrismaMission } from '@prisma/client';
import { Mission } from '../../domain';

/**
 * MissionMapper - Convertit entre le modèle Prisma et l'Entity Domain
 */
export class MissionMapper {
  /**
   * Convertit un enregistrement Prisma en Entity Domain
   */
  static toDomain(prismaMission: PrismaMission): Mission {
    return Mission.reconstruct({
      id: prismaMission.id,
      titre: prismaMission.titre,
      date: prismaMission.date,
      duree: prismaMission.duree,
      lieu: prismaMission.lieu,
      intervenantId: prismaMission.intervenantId,
      createdAt: prismaMission.createdAt,
      updatedAt: prismaMission.updatedAt,
    });
  }

  /**
   * Convertit une Entity Domain en données Prisma pour CREATE
   */
  static toPersistenceCreate(mission: Mission): Omit<PrismaMission, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      titre: mission.titre,
      date: mission.date,
      duree: mission.duree.value, // Extrait la valeur du Value Object
      lieu: mission.lieu.value,   // Extrait la valeur du Value Object
      intervenantId: mission.intervenantId,
    };
  }

  /**
   * Convertit une Entity Domain en données Prisma pour UPDATE
   */
  static toPersistenceUpdate(mission: Mission): Omit<PrismaMission, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      titre: mission.titre,
      date: mission.date,
      duree: mission.duree.value,
      lieu: mission.lieu.value,
      intervenantId: mission.intervenantId,
    };
  }
}
