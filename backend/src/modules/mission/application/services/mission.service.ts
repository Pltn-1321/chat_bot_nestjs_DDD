import { Injectable, Inject } from '@nestjs/common';
import type { EventPublisher } from '../../../../shared/domain';
import {
  EVENT_PUBLISHER,
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '../../../../shared/domain';
import { Mission, MISSION_REPOSITORY } from '../../domain';
import type { MissionRepository } from '../../domain';
import {
  CreateMissionDto,
  UpdateMissionDto,
  AssignMissionDto,
  MissionResponseDto,
} from '../dtos';

/**
 * MissionService - Couche Application
 *
 * Architecture Hexagonale:
 * - Ce service dépend UNIQUEMENT des PORTS (interfaces)
 * - Il ne connaît pas Prisma ou RabbitMQ directement
 * - Les implémentations concrètes sont injectées via les tokens
 *
 * Responsabilités:
 * - Orchestrer les use cases pour les missions
 * - Coordonner Domain et Infrastructure via les Ports
 * - Lever des exceptions DOMAIN (pas HTTP)
 * - Publier les Domain Events via le Port EventPublisher
 */
@Injectable()
export class MissionService {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly repository: MissionRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Crée une nouvelle mission
   *
   * @throws BusinessRuleViolationException si conflit de planning
   */
  async create(dto: CreateMissionDto): Promise<MissionResponseDto> {
    // Si un intervenant est assigné, vérifier les conflits
    if (dto.intervenantId) {
      const hasConflict = await this.repository.hasConflict(
        dto.intervenantId,
        dto.date,
      );
      if (hasConflict) {
        throw new BusinessRuleViolationException(
          `L'intervenant #${dto.intervenantId} a déjà une mission ce jour-là`,
          'MISSION_SCHEDULING_CONFLICT',
        );
      }
    }

    const mission = Mission.create({
      titre: dto.titre,
      date: dto.date,
      duree: dto.duree,
      lieu: dto.lieu,
      intervenantId: dto.intervenantId,
    });

    const saved = await this.repository.save(mission);

    // Publier les Domain Events via le Port
    await this.eventPublisher.publishAll(saved.domainEvents);
    saved.clearDomainEvents();

    return MissionResponseDto.fromEntity(saved);
  }

  /**
   * Récupère une mission par son ID
   *
   * @throws EntityNotFoundException si non trouvée
   */
  async findById(id: number): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new EntityNotFoundException('Mission', id);
    }

    return MissionResponseDto.fromEntity(mission);
  }

  /**
   * Récupère toutes les missions
   */
  async findAll(): Promise<MissionResponseDto[]> {
    const missions = await this.repository.findAll();
    return MissionResponseDto.fromEntities(missions);
  }

  /**
   * Récupère les missions à venir
   */
  async findUpcoming(): Promise<MissionResponseDto[]> {
    const missions = await this.repository.findUpcoming();
    return MissionResponseDto.fromEntities(missions);
  }

  /**
   * Récupère les missions non assignées
   */
  async findUnassigned(): Promise<MissionResponseDto[]> {
    const missions = await this.repository.findUnassigned();
    return MissionResponseDto.fromEntities(missions);
  }

  /**
   * Récupère les missions d'un intervenant
   */
  async findByIntervenant(intervenantId: number): Promise<MissionResponseDto[]> {
    const missions = await this.repository.findByIntervenantId(intervenantId);
    return MissionResponseDto.fromEntities(missions);
  }

  /**
   * Recherche des missions
   */
  async search(query: string): Promise<MissionResponseDto[]> {
    const missions = await this.repository.search(query);
    return MissionResponseDto.fromEntities(missions);
  }

  /**
   * Met à jour une mission
   *
   * @throws EntityNotFoundException si non trouvée
   */
  async update(id: number, dto: UpdateMissionDto): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new EntityNotFoundException('Mission', id);
    }

    mission.update({
      titre: dto.titre,
      date: dto.date,
      duree: dto.duree,
      lieu: dto.lieu,
    });

    const updated = await this.repository.save(mission);

    // Publier les Domain Events via le Port
    await this.eventPublisher.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return MissionResponseDto.fromEntity(updated);
  }

  /**
   * Assigne un intervenant à une mission
   *
   * @throws EntityNotFoundException si mission non trouvée
   * @throws BusinessRuleViolationException si conflit de planning
   */
  async assign(id: number, dto: AssignMissionDto): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new EntityNotFoundException('Mission', id);
    }

    // Vérifier les conflits de planning
    const hasConflict = await this.repository.hasConflict(
      dto.intervenantId,
      mission.date,
      id, // Exclure cette mission
    );
    if (hasConflict) {
      throw new BusinessRuleViolationException(
        `L'intervenant #${dto.intervenantId} a déjà une mission ce jour-là`,
        'MISSION_SCHEDULING_CONFLICT',
      );
    }

    // Utiliser reassign pour gérer le cas où quelqu'un est déjà assigné
    mission.reassignIntervenant(dto.intervenantId);

    const updated = await this.repository.save(mission);

    // Publier les Domain Events via le Port
    await this.eventPublisher.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return MissionResponseDto.fromEntity(updated);
  }

  /**
   * Retire l'intervenant d'une mission
   *
   * @throws EntityNotFoundException si mission non trouvée
   */
  async unassign(id: number): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new EntityNotFoundException('Mission', id);
    }

    mission.unassignIntervenant();

    const updated = await this.repository.save(mission);

    // Publier les Domain Events via le Port
    await this.eventPublisher.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return MissionResponseDto.fromEntity(updated);
  }

  /**
   * Supprime une mission
   *
   * @throws EntityNotFoundException si non trouvée
   */
  async delete(id: number): Promise<void> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new EntityNotFoundException('Mission', id);
    }

    mission.markAsDeleted();

    // Publier les Domain Events AVANT suppression via le Port
    await this.eventPublisher.publishAll(mission.domainEvents);
    mission.clearDomainEvents();

    await this.repository.delete(id);
  }
}
