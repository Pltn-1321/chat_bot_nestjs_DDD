import { Intervenant } from '../entities';
import { Email } from '../value-objects';

/**
 * IntervenantRepository - PORT (Interface)
 *
 * Cette interface définit le CONTRAT pour la persistance des Intervenants.
 * Elle fait partie du DOMAIN et ne connaît PAS Prisma.
 *
 * L'implémentation concrète (Adapter) sera dans la couche Infrastructure
 * et utilisera Prisma pour implémenter ces méthodes.
 *
 * Avantages:
 * - Le Domain ne dépend pas de la technologie de persistance
 * - Facile à mocker pour les tests
 * - Permet de changer d'ORM sans toucher au Domain
 */
export interface IntervenantRepository {
  /**
   * Sauvegarde un intervenant (création ou mise à jour)
   * L'ID est assigné automatiquement à la création
   */
  save(intervenant: Intervenant): Promise<Intervenant>;

  /**
   * Trouve un intervenant par son ID
   * @returns null si non trouvé
   */
  findById(id: number): Promise<Intervenant | null>;

  /**
   * Trouve un intervenant par son email
   * Utile pour vérifier l'unicité
   */
  findByEmail(email: Email): Promise<Intervenant | null>;

  /**
   * Retourne tous les intervenants
   */
  findAll(): Promise<Intervenant[]>;

  /**
   * Recherche des intervenants par critères
   * Cherche dans nom, email, et spécialité
   */
  search(query: string): Promise<Intervenant[]>;

  /**
   * Supprime un intervenant par son ID
   */
  delete(id: number): Promise<void>;

  /**
   * Vérifie si un email existe déjà (pour un autre intervenant)
   * @param email - L'email à vérifier
   * @param excludeId - ID à exclure (pour les mises à jour)
   */
  emailExists(email: Email, excludeId?: number): Promise<boolean>;
}

/**
 * Token d'injection pour NestJS
 * Permet d'injecter l'interface plutôt que l'implémentation concrète
 *
 * Usage dans un service:
 *   constructor(
 *     @Inject(INTERVENANT_REPOSITORY)
 *     private readonly repository: IntervenantRepository
 *   ) {}
 */
export const INTERVENANT_REPOSITORY = Symbol('INTERVENANT_REPOSITORY');
