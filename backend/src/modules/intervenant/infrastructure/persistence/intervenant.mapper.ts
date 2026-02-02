import { Intervenant as PrismaIntervenant } from '@prisma/client';
import { Intervenant } from '../../domain';

/**
 * IntervenantMapper - Convertit entre le modèle Prisma et l'Entity Domain
 *
 * Responsabilités:
 * - toDomain(): Prisma → Domain (pour charger depuis la BDD)
 * - toPersistence(): Domain → Prisma (pour sauvegarder en BDD)
 *
 * Le Mapper est une classe STATIQUE - pas besoin d'instanciation.
 * Il fait partie de la couche Infrastructure car il connaît Prisma.
 */
export class IntervenantMapper {
  /**
   * Convertit un enregistrement Prisma en Entity Domain
   *
   * Utilisé quand on charge des données depuis la BDD.
   * Appelle reconstruct() car l'entité existe déjà (a un ID).
   */
  static toDomain(prismaIntervenant: PrismaIntervenant): Intervenant {
    return Intervenant.reconstruct({
      id: prismaIntervenant.id,
      nom: prismaIntervenant.nom,
      email: prismaIntervenant.email,
      telephone: prismaIntervenant.telephone,
      specialite: prismaIntervenant.specialite,
      createdAt: prismaIntervenant.createdAt,
      updatedAt: prismaIntervenant.updatedAt,
    });
  }

  /**
   * Convertit une Entity Domain en données Prisma pour CREATE
   *
   * Utilisé lors de la création d'un nouvel intervenant.
   * Ne contient PAS l'ID (sera généré par la BDD).
   */
  static toPersistenceCreate(intervenant: Intervenant): Omit<PrismaIntervenant, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      nom: intervenant.nom,
      email: intervenant.email.value, // Extrait la valeur du Value Object
      telephone: intervenant.telephone,
      specialite: intervenant.specialite.value, // Extrait la valeur du Value Object
    };
  }

  /**
   * Convertit une Entity Domain en données Prisma pour UPDATE
   *
   * Utilisé lors de la mise à jour d'un intervenant existant.
   * Contient tous les champs modifiables.
   */
  static toPersistenceUpdate(intervenant: Intervenant): Omit<PrismaIntervenant, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      nom: intervenant.nom,
      email: intervenant.email.value,
      telephone: intervenant.telephone,
      specialite: intervenant.specialite.value,
    };
  }
}
