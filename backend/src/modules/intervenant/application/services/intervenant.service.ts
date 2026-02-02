import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Intervenant, INTERVENANT_REPOSITORY, Email } from '../../domain';
import type { IntervenantRepository } from '../../domain';
import { EventBusService } from '../../../../shared/infrastructure/messaging';
import {
  CreateIntervenantDto,
  UpdateIntervenantDto,
  IntervenantResponseDto,
} from '../dtos';

/**
 * IntervenantService - Couche Application
 *
 * Ce service orchestre les USE CASES pour les intervenants.
 * Il utilise le Repository (via l'interface) pour la persistance.
 *
 * Responsabilités:
 * - Coordonner le Domain et l'Infrastructure
 * - Gérer les règles applicatives (ex: vérifier unicité email)
 * - Convertir DTO ↔ Entity ↔ ResponseDTO
 * - Lever des exceptions HTTP appropriées
 * - Publier les Domain Events vers RabbitMQ
 */
@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Crée un nouvel intervenant
   *
   * @throws ConflictException si l'email existe déjà
   */
  async create(dto: CreateIntervenantDto): Promise<IntervenantResponseDto> {
    // Vérifier que l'email n'existe pas déjà
    const emailExists = await this.repository.emailExists(
      Email.create(dto.email),
    );
    if (emailExists) {
      throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);
    }

    // Créer l'entité Domain (validation métier dans le Domain)
    const intervenant = Intervenant.create({
      nom: dto.nom,
      email: dto.email,
      telephone: dto.telephone,
      specialite: dto.specialite,
    });

    // Persister via le Repository
    const saved = await this.repository.save(intervenant);

    // Publier les Domain Events vers RabbitMQ
    await this.eventBus.publishAll(saved.domainEvents);
    saved.clearDomainEvents();

    return IntervenantResponseDto.fromEntity(saved);
  }

  /**
   * Récupère un intervenant par son ID
   *
   * @throws NotFoundException si non trouvé
   */
  async findById(id: number): Promise<IntervenantResponseDto> {
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new NotFoundException(`Intervenant #${id} non trouvé`);
    }

    return IntervenantResponseDto.fromEntity(intervenant);
  }

  /**
   * Récupère tous les intervenants
   */
  async findAll(): Promise<IntervenantResponseDto[]> {
    const intervenants = await this.repository.findAll();
    return IntervenantResponseDto.fromEntities(intervenants);
  }

  /**
   * Recherche des intervenants
   */
  async search(query: string): Promise<IntervenantResponseDto[]> {
    const intervenants = await this.repository.search(query);
    return IntervenantResponseDto.fromEntities(intervenants);
  }

  /**
   * Met à jour un intervenant
   *
   * @throws NotFoundException si non trouvé
   * @throws ConflictException si le nouvel email existe déjà
   */
  async update(
    id: number,
    dto: UpdateIntervenantDto,
  ): Promise<IntervenantResponseDto> {
    // Récupérer l'intervenant existant
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new NotFoundException(`Intervenant #${id} non trouvé`);
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (dto.email && dto.email !== intervenant.email.value) {
      const emailExists = await this.repository.emailExists(
        Email.create(dto.email),
        id, // Exclure l'intervenant actuel
      );
      if (emailExists) {
        throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);
      }
    }

    // Appliquer les modifications (validation métier dans l'Entity)
    intervenant.update({
      nom: dto.nom,
      email: dto.email,
      telephone: dto.telephone,
      specialite: dto.specialite,
    });

    // Persister
    const updated = await this.repository.save(intervenant);

    // Publier les Domain Events vers RabbitMQ
    await this.eventBus.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return IntervenantResponseDto.fromEntity(updated);
  }

  /**
   * Supprime un intervenant
   *
   * @throws NotFoundException si non trouvé
   */
  async delete(id: number): Promise<void> {
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new NotFoundException(`Intervenant #${id} non trouvé`);
    }

    // Marquer comme supprimé (émet l'événement)
    intervenant.markAsDeleted();

    // Publier les Domain Events AVANT suppression
    await this.eventBus.publishAll(intervenant.domainEvents);
    intervenant.clearDomainEvents();

    await this.repository.delete(id);
  }
}
