import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Module global pour l'accès à la base de données
 *
 * @Global() rend ce module disponible dans toute l'application
 * sans avoir besoin de l'importer dans chaque module.
 *
 * C'est le pattern "Singleton" appliqué à NestJS :
 * une seule instance de PrismaService est créée et partagée.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Permet aux autres modules d'injecter PrismaService
})
export class PrismaModule {}
