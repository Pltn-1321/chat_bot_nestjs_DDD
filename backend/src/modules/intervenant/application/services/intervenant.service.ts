import { Injectable, Inject } from '@nestjs/common';
import type { EventPublisher } from '../../../../shared/domain';
import {
  EVENT_PUBLISHER,
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '../../../../shared/domain';
import { Intervenant, INTERVENANT_REPOSITORY, Email } from '../../domain';
import type { IntervenantRepository } from '../../domain';
import {
  CreateIntervenantDto,
  UpdateIntervenantDto,
  IntervenantResponseDto,
} from '../dtos';

/**
 * IntervenantService - Couche Application
 *
 * Architecture Hexagonale:
 * - Ce service dépend UNIQUEMENT des PORTS (interfaces)
 * - Il ne connaît pas Prisma ou RabbitMQ directement
 * - Les implémentations concrètes sont injectées via les tokens
 *
 * Responsabilités:
 * - Orchestrer les USE CASES pour les intervenants
 * - Coordonner Domain et Infrastructure via les Ports
 * - Gérer les règles applicatives (ex: vérifier unicité email)
 * - Convertir DTO ↔ Entity ↔ ResponseDTO
 * - Lever des exceptions DOMAIN (pas HTTP)
 * - Publier les Domain Events via le Port EventPublisher
 */
@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Crée un nouvel intervenant
   *
   * @throws BusinessRuleViolationException si l'email existe déjà
   */
  async create(dto: CreateIntervenantDto): Promise<IntervenantResponseDto> {
    // Vérifier que l'email n'existe pas déjà
    const emailExists = await this.repository.emailExists(
      Email.create(dto.email),
    );
    if (emailExists) {
      throw new BusinessRuleViolationException(
        `L'email ${dto.email} est déjà utilisé`,
        'EMAIL_ALREADY_EXISTS',
      );
    }

    // Créer l'entité Domain (validation métier dans le Domain)
    const intervenant = Intervenant.create({
      nom: dto.nom,
      email: dto.email,
      telephone: dto.telephone,
      specialite: dto.specialite,
    });

    // Persister via le Repository Port
    const saved = await this.repository.save(intervenant);

    // Publier les Domain Events via le Port
    await this.eventPublisher.publishAll(saved.domainEvents);
    saved.clearDomainEvents();

    return IntervenantResponseDto.fromEntity(saved);
  }

  /**
   * Récupère un intervenant par son ID
   *
   * @throws EntityNotFoundException si non trouvé
   */
  async findById(id: number): Promise<IntervenantResponseDto> {
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new EntityNotFoundException('Intervenant', id);
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
   * @throws EntityNotFoundException si non trouvé
   * @throws BusinessRuleViolationException si le nouvel email existe déjà
   */
  async update(
    id: number,
    dto: UpdateIntervenantDto,
  ): Promise<IntervenantResponseDto> {
    // Récupérer l'intervenant existant
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new EntityNotFoundException('Intervenant', id);
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (dto.email && dto.email !== intervenant.email.value) {
      const emailExists = await this.repository.emailExists(
        Email.create(dto.email),
        id, // Exclure l'intervenant actuel
      );
      if (emailExists) {
        throw new BusinessRuleViolationException(
          `L'email ${dto.email} est déjà utilisé`,
          'EMAIL_ALREADY_EXISTS',
        );
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

    // Publier les Domain Events via le Port
    await this.eventPublisher.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return IntervenantResponseDto.fromEntity(updated);
  }

  /**
   * Supprime un intervenant
   *
   * @throws EntityNotFoundException si non trouvé
   */
  async delete(id: number): Promise<void> {
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new EntityNotFoundException('Intervenant', id);
    }

    // Marquer comme supprimé (émet l'événement)
    intervenant.markAsDeleted();

    // Publier les Domain Events AVANT suppression via le Port
    await this.eventPublisher.publishAll(intervenant.domainEvents);
    intervenant.clearDomainEvents();

    await this.repository.delete(id);
  }
}
