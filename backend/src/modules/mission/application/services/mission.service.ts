import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Mission, MISSION_REPOSITORY } from '../../domain';
import type { MissionRepository } from '../../domain';
import { EventBusService } from '../../../../shared/infrastructure/messaging';
import {
  CreateMissionDto,
  UpdateMissionDto,
  AssignMissionDto,
  MissionResponseDto,
} from '../dtos';

/**
 * MissionService - Couche Application
 *
 * Orchestre les use cases pour les missions.
 * Publie les Domain Events vers RabbitMQ.
 */
@Injectable()
export class MissionService {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly repository: MissionRepository,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Crée une nouvelle mission
   */
  async create(dto: CreateMissionDto): Promise<MissionResponseDto> {
    // Si un intervenant est assigné, vérifier les conflits
    if (dto.intervenantId) {
      const hasConflict = await this.repository.hasConflict(
        dto.intervenantId,
        dto.date,
      );
      if (hasConflict) {
        throw new ConflictException(
          `L'intervenant #${dto.intervenantId} a déjà une mission ce jour-là`,
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

    // Publier les Domain Events (MissionCreated, éventuellement MissionAssigned)
    await this.eventBus.publishAll(saved.domainEvents);
    saved.clearDomainEvents();

    return MissionResponseDto.fromEntity(saved);
  }

  /**
   * Récupère une mission par son ID
   */
  async findById(id: number): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new NotFoundException(`Mission #${id} non trouvée`);
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
   */
  async update(id: number, dto: UpdateMissionDto): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new NotFoundException(`Mission #${id} non trouvée`);
    }

    mission.update({
      titre: dto.titre,
      date: dto.date,
      duree: dto.duree,
      lieu: dto.lieu,
    });

    const updated = await this.repository.save(mission);

    // Publier MissionUpdated
    await this.eventBus.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return MissionResponseDto.fromEntity(updated);
  }

  /**
   * Assigne un intervenant à une mission
   */
  async assign(id: number, dto: AssignMissionDto): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new NotFoundException(`Mission #${id} non trouvée`);
    }

    // Vérifier les conflits de planning
    const hasConflict = await this.repository.hasConflict(
      dto.intervenantId,
      mission.date,
      id, // Exclure cette mission
    );
    if (hasConflict) {
      throw new ConflictException(
        `L'intervenant #${dto.intervenantId} a déjà une mission ce jour-là`,
      );
    }

    // Utiliser reassign pour gérer le cas où quelqu'un est déjà assigné
    mission.reassignIntervenant(dto.intervenantId);

    const updated = await this.repository.save(mission);

    // Publier MissionAssigned (et éventuellement MissionUnassigned si réassignation)
    await this.eventBus.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return MissionResponseDto.fromEntity(updated);
  }

  /**
   * Retire l'intervenant d'une mission
   */
  async unassign(id: number): Promise<MissionResponseDto> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new NotFoundException(`Mission #${id} non trouvée`);
    }

    mission.unassignIntervenant();

    const updated = await this.repository.save(mission);

    // Publier MissionUnassigned
    await this.eventBus.publishAll(updated.domainEvents);
    updated.clearDomainEvents();

    return MissionResponseDto.fromEntity(updated);
  }

  /**
   * Supprime une mission
   */
  async delete(id: number): Promise<void> {
    const mission = await this.repository.findById(id);

    if (!mission) {
      throw new NotFoundException(`Mission #${id} non trouvée`);
    }

    mission.markAsDeleted();

    // Publier MissionDeleted AVANT suppression
    await this.eventBus.publishAll(mission.domainEvents);
    mission.clearDomainEvents();

    await this.repository.delete(id);
  }
}
