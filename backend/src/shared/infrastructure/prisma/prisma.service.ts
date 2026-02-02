import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Adapter pour la connexion à la base de données
 *
 * Ce service encapsule PrismaClient et gère le cycle de vie de la connexion.
 * Il implémente OnModuleInit et OnModuleDestroy pour se connecter/déconnecter
 * automatiquement quand le module NestJS démarre/s'arrête.
 *
 * @Injectable() marque cette classe comme injectable via le système DI de NestJS
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Appelé automatiquement quand le module NestJS est initialisé
   * Établit la connexion à la base de données
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Appelé automatiquement quand l'application s'arrête
   * Ferme proprement la connexion à la base de données
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
