import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Mission, MissionRepository } from '../../domain';
import { MissionMapper } from './mission.mapper';

/**
 * PrismaMissionRepository - ADAPTER
 *
 * Implémente l'interface MissionRepository (le PORT).
 * Inclut des requêtes métier spécifiques (findByIntervenantId, hasConflict, etc.)
 */
@Injectable()
export class PrismaMissionRepository implements MissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sauvegarde une mission (création ou mise à jour)
   */
  async save(mission: Mission): Promise<Mission> {
    if (mission.id === 0) {
      const data = MissionMapper.toPersistenceCreate(mission);

      const created = await this.prisma.client.mission.create({
        data,
      });

      return MissionMapper.toDomain(created);
    }

    const data = MissionMapper.toPersistenceUpdate(mission);

    const updated = await this.prisma.client.mission.update({
      where: { id: mission.id },
      data,
    });

    return MissionMapper.toDomain(updated);
  }

  /**
   * Trouve une mission par son ID
   */
  async findById(id: number): Promise<Mission | null> {
    const found = await this.prisma.client.mission.findUnique({
      where: { id },
    });

    return found ? MissionMapper.toDomain(found) : null;
  }

  /**
   * Retourne toutes les missions
   */
  async findAll(): Promise<Mission[]> {
    const all = await this.prisma.client.mission.findMany({
      orderBy: { date: 'asc' },
    });

    return all.map(MissionMapper.toDomain);
  }

  /**
   * Trouve les missions assignées à un intervenant
   */
  async findByIntervenantId(intervenantId: number): Promise<Mission[]> {
    const missions = await this.prisma.client.mission.findMany({
      where: { intervenantId },
      orderBy: { date: 'asc' },
    });

    return missions.map(MissionMapper.toDomain);
  }

  /**
   * Trouve les missions non assignées
   */
  async findUnassigned(): Promise<Mission[]> {
    const missions = await this.prisma.client.mission.findMany({
      where: { intervenantId: null },
      orderBy: { date: 'asc' },
    });

    return missions.map(MissionMapper.toDomain);
  }

  /**
   * Trouve les missions à venir (date > maintenant)
   */
  async findUpcoming(): Promise<Mission[]> {
    const now = new Date();

    const missions = await this.prisma.client.mission.findMany({
      where: {
        date: { gt: now },
      },
      orderBy: { date: 'asc' },
    });

    return missions.map(MissionMapper.toDomain);
  }

  /**
   * Trouve les missions dans une plage de dates
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Mission[]> {
    const missions = await this.prisma.client.mission.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return missions.map(MissionMapper.toDomain);
  }

  /**
   * Recherche par titre ou lieu
   */
  async search(query: string): Promise<Mission[]> {
    const missions = await this.prisma.client.mission.findMany({
      where: {
        OR: [
          { titre: { contains: query, mode: 'insensitive' } },
          { lieu: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'asc' },
    });

    return missions.map(MissionMapper.toDomain);
  }

  /**
   * Supprime une mission
   */
  async delete(id: number): Promise<void> {
    await this.prisma.client.mission.delete({
      where: { id },
    });
  }

  /**
   * Vérifie si un intervenant a déjà une mission à une date donnée
   *
   * Utile pour éviter les conflits de planning.
   * Compare le même jour (pas l'heure exacte).
   */
  async hasConflict(
    intervenantId: number,
    date: Date,
    excludeMissionId?: number,
  ): Promise<boolean> {
    // Début et fin du jour
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const conflicting = await this.prisma.client.mission.findFirst({
      where: {
        intervenantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(excludeMissionId && { id: { not: excludeMissionId } }),
      },
    });

    return conflicting !== null;
  }
}
