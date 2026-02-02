import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Intervenant, IntervenantRepository, Email } from '../../domain';
import { IntervenantMapper } from './intervenant.mapper';

/**
 * PrismaIntervenantRepository - ADAPTER
 *
 * Cette classe IMPLÉMENTE l'interface IntervenantRepository (le PORT).
 * Elle utilise Prisma pour la persistance.
 *
 * Points clés:
 * - @Injectable() : permet l'injection par NestJS
 * - implements IntervenantRepository : respecte le contrat du Domain
 * - Utilise le Mapper pour les conversions Domain ↔ Prisma
 *
 * Le Domain ne connaît PAS cette classe - il ne connaît que l'interface.
 */
@Injectable()
export class PrismaIntervenantRepository implements IntervenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sauvegarde un intervenant (création ou mise à jour)
   *
   * Si l'ID est 0, c'est une création (la BDD génère l'ID).
   * Sinon, c'est une mise à jour.
   */
  async save(intervenant: Intervenant): Promise<Intervenant> {
    // Création (ID = 0 signifie "pas encore persisté")
    if (intervenant.id === 0) {
      const data = IntervenantMapper.toPersistenceCreate(intervenant);

      const created = await this.prisma.client.intervenant.create({
        data,
      });

      return IntervenantMapper.toDomain(created);
    }

    // Mise à jour
    const data = IntervenantMapper.toPersistenceUpdate(intervenant);

    const updated = await this.prisma.client.intervenant.update({
      where: { id: intervenant.id },
      data,
    });

    return IntervenantMapper.toDomain(updated);
  }

  /**
   * Trouve un intervenant par son ID
   */
  async findById(id: number): Promise<Intervenant | null> {
    const found = await this.prisma.client.intervenant.findUnique({
      where: { id },
    });

    if (!found) {
      return null;
    }

    return IntervenantMapper.toDomain(found);
  }

  /**
   * Trouve un intervenant par son email
   */
  async findByEmail(email: Email): Promise<Intervenant | null> {
    const found = await this.prisma.client.intervenant.findUnique({
      where: { email: email.value },
    });

    if (!found) {
      return null;
    }

    return IntervenantMapper.toDomain(found);
  }

  /**
   * Retourne tous les intervenants
   */
  async findAll(): Promise<Intervenant[]> {
    const all = await this.prisma.client.intervenant.findMany({
      orderBy: { nom: 'asc' },
    });

    return all.map(IntervenantMapper.toDomain);
  }

  /**
   * Recherche des intervenants par critères
   * Cherche dans nom, email, et spécialité
   */
  async search(query: string): Promise<Intervenant[]> {
    const results = await this.prisma.client.intervenant.findMany({
      where: {
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { specialite: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { nom: 'asc' },
    });

    return results.map(IntervenantMapper.toDomain);
  }

  /**
   * Supprime un intervenant
   */
  async delete(id: number): Promise<void> {
    await this.prisma.client.intervenant.delete({
      where: { id },
    });
  }

  /**
   * Vérifie si un email existe déjà (pour un autre intervenant)
   */
  async emailExists(email: Email, excludeId?: number): Promise<boolean> {
    const found = await this.prisma.client.intervenant.findFirst({
      where: {
        email: email.value,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return found !== null;
  }
}
