import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/infrastructure/prisma';

@Module({
  imports: [
    // Configuration globale - charge le fichier .env
    ConfigModule.forRoot({
      isGlobal: true, // Disponible partout sans ré-import
    }),

    // Base de données - PrismaModule est @Global, donc disponible partout
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
