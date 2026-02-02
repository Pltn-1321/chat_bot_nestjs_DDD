# Phase 4 : Couche Application - Services et Controllers

## Vue d'ensemble

La **couche Application** orchestre les **use cases** de l'application. Elle fait le lien entre la présentation (API) et le domaine métier.

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Request                             │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION                          │   │
│  │                                                          │   │
│  │   Controller ──────► Validation DTO (class-validator)   │   │
│  │                              │                           │   │
│  └──────────────────────────────┼───────────────────────────┘   │
│                                 │                                │
│                                 ▼                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    APPLICATION                           │   │
│  │                                                          │   │
│  │   Service ──────► Orchestration Use Case                │   │
│  │              │                                           │   │
│  │              ├───► Règles applicatives                  │   │
│  │              │     (unicité email, conflits planning)    │   │
│  │              │                                           │   │
│  │              └───► Conversion DTO ↔ Entity              │   │
│  │                              │                           │   │
│  └──────────────────────────────┼───────────────────────────┘   │
│                                 │                                │
│                                 ▼                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      DOMAIN                              │   │
│  │                                                          │   │
│  │   Entity.create() ──────► Validation métier             │   │
│  │   Repository.save() ──────► Persistance                 │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Structure des fichiers

```
backend/src/modules/intervenant/
├── domain/                          # Phase 2
├── infrastructure/                  # Phase 3
├── application/                     # ← NOUVEAU
│   ├── dtos/
│   │   ├── create-intervenant.dto.ts
│   │   ├── update-intervenant.dto.ts
│   │   ├── intervenant-response.dto.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── intervenant.service.ts
│   │   └── index.ts
│   └── index.ts
├── presentation/                    # ← NOUVEAU
│   ├── intervenant.controller.ts
│   └── index.ts
└── intervenant.module.ts
```

---

## 1. Les DTOs (Data Transfer Objects)

### Rôle des DTOs

Les DTOs définissent la **structure des données** échangées avec l'API :
- **Input DTOs** : Données reçues (Create, Update)
- **Output DTOs** : Données renvoyées (Response)

```
┌─────────────────────────────────────────────────────────────────┐
│                          DTOs                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   HTTP Request                                                   │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────────────┐                                           │
│   │ CreateIntervenant│    Validation avec class-validator       │
│   │      DTO        │    @IsString(), @IsEmail(), etc.          │
│   └────────┬────────┘                                           │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                           │
│   │    Service      │    Convertit DTO → Entity                 │
│   └────────┬────────┘                                           │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                           │
│   │ Intervenant     │    Convertit Entity → ResponseDTO         │
│   │  ResponseDTO    │                                           │
│   └─────────────────┘                                           │
│            │                                                     │
│            ▼                                                     │
│   HTTP Response                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code : CreateIntervenantDto

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateIntervenantDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit avoir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom: string;

  @IsEmail({}, { message: 'Format d\'email invalide' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  specialite: string;
}
```

### Décorateurs class-validator courants

| Décorateur | Description | Exemple |
|------------|-------------|---------|
| `@IsString()` | Doit être une string | `nom: string` |
| `@IsEmail()` | Format email valide | `email: string` |
| `@IsInt()` | Nombre entier | `duree: number` |
| `@IsDate()` | Date valide | `date: Date` |
| `@IsOptional()` | Champ optionnel | `telephone?: string` |
| `@MinLength(n)` | Longueur minimum | `@MinLength(2)` |
| `@MaxLength(n)` | Longueur maximum | `@MaxLength(100)` |
| `@Min(n)` | Valeur minimum | `@Min(15)` |
| `@Max(n)` | Valeur maximum | `@Max(480)` |

### Code : IntervenantResponseDto

```typescript
import { Intervenant } from '../../domain';

export class IntervenantResponseDto {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  specialite: string;
  createdAt: Date;
  updatedAt: Date;

  // Factory method : Entity → DTO
  static fromEntity(entity: Intervenant): IntervenantResponseDto {
    const dto = new IntervenantResponseDto();
    dto.id = entity.id;
    dto.nom = entity.nom;
    dto.email = entity.email.value;      // Value Object → string
    dto.telephone = entity.telephone;
    dto.specialite = entity.specialite.value;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Intervenant[]): IntervenantResponseDto[] {
    return entities.map((e) => this.fromEntity(e));
  }
}
```

---

## 2. Le Service (Use Cases)

### Rôle du Service

Le Service **orchestre** les use cases :
1. Vérifie les règles applicatives (ex: unicité email)
2. Crée/manipule les entités Domain
3. Utilise le Repository pour la persistance
4. Convertit Entity ↔ DTO

```
┌─────────────────────────────────────────────────────────────────┐
│                    IntervenantService                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   create(dto)                                                    │
│   ├── 1. Vérifier unicité email (règle applicative)            │
│   ├── 2. Intervenant.create(props) (validation Domain)          │
│   ├── 3. repository.save() (persistance)                        │
│   └── 4. ResponseDTO.fromEntity() (conversion)                  │
│                                                                  │
│   findById(id)                                                   │
│   ├── 1. repository.findById()                                  │
│   ├── 2. Vérifier existence (NotFoundException si null)         │
│   └── 3. ResponseDTO.fromEntity()                               │
│                                                                  │
│   update(id, dto)                                                │
│   ├── 1. repository.findById() + vérifier existence            │
│   ├── 2. Vérifier unicité nouvel email (si changé)             │
│   ├── 3. entity.update(props) (validation Domain)               │
│   ├── 4. repository.save()                                      │
│   └── 5. ResponseDTO.fromEntity()                               │
│                                                                  │
│   delete(id)                                                     │
│   ├── 1. repository.findById() + vérifier existence            │
│   ├── 2. entity.markAsDeleted() (émet événement)               │
│   └── 3. repository.delete()                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code : IntervenantService (extraits)

```typescript
@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,
  ) {}

  async create(dto: CreateIntervenantDto): Promise<IntervenantResponseDto> {
    // 1. Règle applicative : unicité email
    const emailExists = await this.repository.emailExists(
      Email.create(dto.email),
    );
    if (emailExists) {
      throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);
    }

    // 2. Création Entity (validation Domain)
    const intervenant = Intervenant.create({
      nom: dto.nom,
      email: dto.email,
      telephone: dto.telephone,
      specialite: dto.specialite,
    });

    // 3. Persistance
    const saved = await this.repository.save(intervenant);

    // 4. Conversion vers DTO de réponse
    return IntervenantResponseDto.fromEntity(saved);
  }

  async findById(id: number): Promise<IntervenantResponseDto> {
    const intervenant = await this.repository.findById(id);

    if (!intervenant) {
      throw new NotFoundException(`Intervenant #${id} non trouvé`);
    }

    return IntervenantResponseDto.fromEntity(intervenant);
  }
}
```

### Différence : Règles Domain vs Règles Applicatives

| Type | Où ? | Exemple |
|------|------|---------|
| **Règle Domain** | Entity/Value Object | Email doit être valide, nom >= 2 chars |
| **Règle Applicative** | Service | Email doit être unique dans le système |

---

## 3. Le Controller (API REST)

### Rôle du Controller

Le Controller **expose l'API HTTP** :
- Définit les routes (endpoints)
- Reçoit les requêtes HTTP
- Délègue au Service
- Renvoie les réponses HTTP

```
┌─────────────────────────────────────────────────────────────────┐
│                   IntervenantController                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   @Controller('intervenants')                                   │
│                                                                  │
│   POST   /intervenants         → create(@Body() dto)            │
│   GET    /intervenants         → findAll()                      │
│   GET    /intervenants/search  → search(@Query('q') query)      │
│   GET    /intervenants/:id     → findById(@Param('id') id)      │
│   PUT    /intervenants/:id     → update(@Param('id'), @Body())  │
│   DELETE /intervenants/:id     → delete(@Param('id') id)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code : IntervenantController

```typescript
@Controller('intervenants')
export class IntervenantController {
  constructor(private readonly intervenantService: IntervenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)  // 201 au lieu de 200
  async create(@Body() dto: CreateIntervenantDto): Promise<IntervenantResponseDto> {
    return this.intervenantService.create(dto);
  }

  @Get()
  async findAll(): Promise<IntervenantResponseDto[]> {
    return this.intervenantService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<IntervenantResponseDto[]> {
    return this.intervenantService.search(query);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,  // Conversion string → number
  ): Promise<IntervenantResponseDto> {
    return this.intervenantService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIntervenantDto,
  ): Promise<IntervenantResponseDto> {
    return this.intervenantService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)  // 204 sans body
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.intervenantService.delete(id);
  }
}
```

### Décorateurs NestJS pour Controllers

| Décorateur | Description |
|------------|-------------|
| `@Controller('path')` | Définit le préfixe de route |
| `@Get()`, `@Post()`, `@Put()`, `@Delete()` | Méthode HTTP |
| `@Body()` | Corps de la requête (JSON) |
| `@Param('name')` | Paramètre d'URL |
| `@Query('name')` | Query string |
| `@HttpCode(status)` | Code HTTP de réponse |
| `ParseIntPipe` | Convertit string → number |

---

## 4. ValidationPipe Global

### Configuration dans main.ts

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Supprime propriétés inconnues
      forbidNonWhitelisted: true, // Erreur si propriétés inconnues
      transform: true,           // Active les transformations
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();  // Pour le frontend
  await app.listen(3000);
}
```

### Comportement de la validation

```
┌─────────────────────────────────────────────────────────────────┐
│                     Requête entrante                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   {                                                              │
│     "nom": "J",           ← Trop court (MinLength 2)            │
│     "email": "invalid",   ← Format invalide                     │
│     "hack": "value"       ← Propriété inconnue                  │
│   }                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ValidationPipe                                 │
│                                                                  │
│   1. Vérifie les décorateurs class-validator                    │
│   2. Collecte toutes les erreurs                                │
│   3. Renvoie 400 Bad Request avec détails                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Réponse d'erreur (400)                         │
├─────────────────────────────────────────────────────────────────┤
│   {                                                              │
│     "statusCode": 400,                                          │
│     "message": [                                                │
│       "Le nom doit avoir au moins 2 caractères",                │
│       "Format d'email invalide",                                │
│       "property hack should not exist"                          │
│     ],                                                          │
│     "error": "Bad Request"                                      │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Configuration du Module

### IntervenantModule complet

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [IntervenantController],  // API REST
  providers: [
    // Infrastructure: PORT ↔ ADAPTER
    {
      provide: INTERVENANT_REPOSITORY,
      useClass: PrismaIntervenantRepository,
    },
    // Application: Service
    IntervenantService,
  ],
  exports: [INTERVENANT_REPOSITORY, IntervenantService],
})
export class IntervenantModule {}
```

---

## 6. API REST complète

### Intervenants

| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/intervenants` | Créer | `CreateIntervenantDto` |
| GET | `/intervenants` | Lister tous | - |
| GET | `/intervenants/search?q=` | Rechercher | - |
| GET | `/intervenants/:id` | Par ID | - |
| PUT | `/intervenants/:id` | Modifier | `UpdateIntervenantDto` |
| DELETE | `/intervenants/:id` | Supprimer | - |

### Missions

| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/missions` | Créer | `CreateMissionDto` |
| GET | `/missions` | Lister toutes | - |
| GET | `/missions/upcoming` | À venir | - |
| GET | `/missions/unassigned` | Non assignées | - |
| GET | `/missions/search?q=` | Rechercher | - |
| GET | `/missions/intervenant/:id` | Par intervenant | - |
| GET | `/missions/:id` | Par ID | - |
| PUT | `/missions/:id` | Modifier | `UpdateMissionDto` |
| POST | `/missions/:id/assign` | Assigner | `AssignMissionDto` |
| POST | `/missions/:id/unassign` | Désassigner | - |
| DELETE | `/missions/:id` | Supprimer | - |

---

## 7. Exemples de requêtes

### Créer un intervenant

```bash
curl -X POST http://localhost:3000/intervenants \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jean Dupont",
    "email": "jean.dupont@email.com",
    "telephone": "0612345678",
    "specialite": "JavaScript"
  }'
```

### Créer une mission

```bash
curl -X POST http://localhost:3000/missions \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Cours React Avancé",
    "date": "2025-03-20T09:00:00Z",
    "duree": 180,
    "lieu": "Paris"
  }'
```

### Assigner un intervenant

```bash
curl -X POST http://localhost:3000/missions/1/assign \
  -H "Content-Type: application/json" \
  -d '{
    "intervenantId": 1
  }'
```

---

## Prochaine étape : Phase 5

Dans la Phase 5 (Event-Driven), nous allons :

1. Configurer **RabbitMQ** avec Docker
2. Créer un **EventBus** pour publier les Domain Events
3. Implémenter des **consumers** pour réagir aux événements

```
┌─────────────────┐     Domain Event    ┌─────────────────┐
│   Repository    │ ──────────────────► │    RabbitMQ     │
│   .save()       │                     │                 │
└─────────────────┘                     └────────┬────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
           ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
           │ Email Service │          │  Audit Log    │          │  Analytics    │
           │ (notification)│          │ (historique)  │          │ (stats)       │
           └───────────────┘          └───────────────┘          └───────────────┘
```
