import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation globale des DTOs avec class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non déclarées dans le DTO
      forbidNonWhitelisted: true, // Erreur si propriétés inconnues
      transform: true, // Transforme automatiquement les types (ex: string → number)
      transformOptions: {
        enableImplicitConversion: true, // Conversion implicite des types
      },
    }),
  );

  // CORS pour le frontend
  app.enableCors();

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Gestion des Intervenants')
    .setDescription('API pour la gestion des intervenants et leurs missions')
    .setVersion('1.0')
    .addTag('intervenants', 'Gestion des intervenants')
    .addTag('missions', 'Gestion des missions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
