import { Mission } from '../entities';

/**
 * MissionRepository - PORT (Interface)
 *
 * Définit le contrat pour la persistance des Missions.
 * Inclut des méthodes spécifiques aux requêtes métier.
 */
export interface MissionRepository {
  /**
   * Sauvegarde une mission (création ou mise à jour)
   */
  save(mission: Mission): Promise<Mission>;

  /**
   * Trouve une mission par son ID
   */
  findById(id: number): Promise<Mission | null>;

  /**
   * Retourne toutes les missions
   */
  findAll(): Promise<Mission[]>;

  /**
   * Trouve les missions assignées à un intervenant
   */
  findByIntervenantId(intervenantId: number): Promise<Mission[]>;

  /**
   * Trouve les missions non assignées
   */
  findUnassigned(): Promise<Mission[]>;

  /**
   * Trouve les missions à venir (date > maintenant)
   */
  findUpcoming(): Promise<Mission[]>;

  /**
   * Trouve les missions dans une plage de dates
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Mission[]>;

  /**
   * Recherche par titre ou lieu
   */
  search(query: string): Promise<Mission[]>;

  /**
   * Supprime une mission
   */
  delete(id: number): Promise<void>;

  /**
   * Vérifie si un intervenant a déjà une mission à une date donnée
   * Utile pour éviter les conflits de planning
   */
  hasConflict(intervenantId: number, date: Date, excludeMissionId?: number): Promise<boolean>;
}

/**
 * Token d'injection pour NestJS
 */
export const MISSION_REPOSITORY = Symbol('MISSION_REPOSITORY');
