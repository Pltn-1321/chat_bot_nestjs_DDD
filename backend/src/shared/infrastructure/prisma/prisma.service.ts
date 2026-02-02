import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService - Adapter pour la connexion à la base de données
 *
 * Prisma 7 utilise le pattern "Driver Adapter" au lieu de l'héritage direct.
 * Cela permet d'utiliser le driver PostgreSQL natif (pg) avec un pool de connexions.
 *
 * Avantages du Driver Adapter :
 * - Contrôle total du pool de connexions
 * - Meilleure compatibilité serverless
 * - Performance optimisée via le driver natif
 *
 * @Injectable() marque cette classe comme injectable via le système DI de NestJS
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private _client: PrismaClient;

  constructor() {
    // Création du pool de connexions PostgreSQL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Création de l'adapter Prisma pour PostgreSQL
    const adapter = new PrismaPg(this.pool);

    // Instanciation du PrismaClient avec l'adapter
    this._client = new PrismaClient({ adapter });
  }

  /**
   * Expose le client Prisma pour les requêtes
   * Utilisation : prismaService.client.intervenant.findMany()
   */
  get client(): PrismaClient {
    return this._client;
  }

  /**
   * Appelé automatiquement quand le module NestJS est initialisé
   * Établit la connexion à la base de données
   */
  async onModuleInit() {
    await this._client.$connect();
  }

  /**
   * Appelé automatiquement quand l'application s'arrête
   * Ferme proprement la connexion à la base de données et le pool
   */
  async onModuleDestroy() {
    await this._client.$disconnect();
    await this.pool.end();
  }
}
