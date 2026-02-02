# Phase 3 : Couche Infrastructure - Les Adapters

## Vue d'ensemble

La **couche Infrastructure** contient les **implémentations concrètes** des interfaces définies dans le Domain (les Ports). C'est ici qu'on trouve le code qui interagit avec les technologies externes : base de données, APIs, message queues, etc.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  DOMAIN (Phase 2)              INFRASTRUCTURE (Phase 3)         │
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │IntervenantRepository│◄─────│PrismaIntervenantRepository  │  │
│  │   (PORT = interface)│      │     (ADAPTER = classe)      │  │
│  └─────────────────────┘      └─────────────────────────────┘  │
│                                              │                   │
│  Le Domain définit                           │ utilise           │
│  le CONTRAT                                  ▼                   │
│                                     ┌───────────────┐           │
│                                     │ PrismaService │           │
│                                     │   (ORM)       │           │
│                                     └───────────────┘           │
│                                              │                   │
│                                              ▼                   │
│                                     ┌───────────────┐           │
│                                     │  PostgreSQL   │           │
│                                     └───────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Principe clé** : L'Infrastructure DÉPEND du Domain, jamais l'inverse.

---

## Structure des fichiers

```
backend/src/modules/
├── intervenant/
│   ├── domain/                          # Phase 2
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── intervenant.mapper.ts    # Conversion Domain ↔ Prisma
│   │   │   ├── prisma-intervenant.repository.ts  # ADAPTER
│   │   │   └── index.ts
│   │   └── index.ts
│   └── intervenant.module.ts            # Configuration DI NestJS
│
└── mission/
    ├── domain/
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── mission.mapper.ts
    │   │   ├── prisma-mission.repository.ts
    │   │   └── index.ts
    │   └── index.ts
    └── mission.module.ts
```

---

## 1. Le Mapper

### Rôle du Mapper

Le Mapper est responsable de la **conversion bidirectionnelle** entre :
- Les **entités Domain** (objets riches avec logique métier)
- Les **modèles Prisma** (objets simples pour la BDD)

```
┌─────────────────────────────────────────────────────────────────┐
│                          MAPPER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DOMAIN                                      PRISMA             │
│   (Entity)                                    (Model)            │
│                                                                  │
│  ┌──────────────┐    toDomain()    ┌──────────────────┐        │
│  │ Intervenant  │◄─────────────────│ PrismaIntervenant │        │
│  │              │                  │                   │        │
│  │ - Email (VO) │ toPersistence() │ - email: string   │        │
│  │ - Specialite │─────────────────►│ - specialite: str │        │
│  └──────────────┘                  └──────────────────────┘     │
│                                                                  │
│   Objets RICHES                    Objets SIMPLES               │
│   (Value Objects,                  (types primitifs,            │
│    méthodes métier)                 pas de logique)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code : IntervenantMapper

```typescript
import { Intervenant as PrismaIntervenant } from '@prisma/client';
import { Intervenant } from '../../domain';

export class IntervenantMapper {
  /**
   * Prisma → Domain
   * Utilisé quand on CHARGE depuis la BDD
   */
  static toDomain(prisma: PrismaIntervenant): Intervenant {
    return Intervenant.reconstruct({
      id: prisma.id,
      nom: prisma.nom,
      email: prisma.email,           // string → sera converti en Email VO
      telephone: prisma.telephone,
      specialite: prisma.specialite, // string → sera converti en Specialite VO
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  /**
   * Domain → Prisma (pour CREATE)
   * Utilisé quand on SAUVEGARDE en BDD
   */
  static toPersistenceCreate(entity: Intervenant) {
    return {
      nom: entity.nom,
      email: entity.email.value,         // Email VO → string
      telephone: entity.telephone,
      specialite: entity.specialite.value, // Specialite VO → string
    };
  }
}
```

### Points clés

| Direction | Méthode | Quand l'utiliser |
|-----------|---------|------------------|
| Prisma → Domain | `toDomain()` | Après un `findById`, `findAll`, etc. |
| Domain → Prisma | `toPersistenceCreate()` | Avant un `create()` |
| Domain → Prisma | `toPersistenceUpdate()` | Avant un `update()` |

---

## 2. Le Repository (Adapter)

### Rôle du Repository

Le Repository **implémente** l'interface définie dans le Domain. Il utilise Prisma pour effectuer les opérations de persistance.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   IntervenantRepository          PrismaIntervenantRepository    │
│   (interface = PORT)             (classe = ADAPTER)             │
│                                                                  │
│   save()          ◄─────────────  save() {                      │
│   findById()                        if (id === 0) {             │
│   findByEmail()                       prisma.create(...)        │
│   findAll()                         } else {                    │
│   delete()                            prisma.update(...)        │
│                                     }                           │
│                                   }                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code : PrismaIntervenantRepository

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma';
import { Intervenant, IntervenantRepository, Email } from '../../domain';
import { IntervenantMapper } from './intervenant.mapper';

@Injectable()
export class PrismaIntervenantRepository implements IntervenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(intervenant: Intervenant): Promise<Intervenant> {
    // ID = 0 signifie "nouveau" (pas encore persisté)
    if (intervenant.id === 0) {
      const data = IntervenantMapper.toPersistenceCreate(intervenant);
      const created = await this.prisma.intervenant.create({ data });
      return IntervenantMapper.toDomain(created);
    }

    // Sinon, c'est une mise à jour
    const data = IntervenantMapper.toPersistenceUpdate(intervenant);
    const updated = await this.prisma.intervenant.update({
      where: { id: intervenant.id },
      data,
    });
    return IntervenantMapper.toDomain(updated);
  }

  async findById(id: number): Promise<Intervenant | null> {
    const found = await this.prisma.intervenant.findUnique({
      where: { id },
    });
    return found ? IntervenantMapper.toDomain(found) : null;
  }

  async findByEmail(email: Email): Promise<Intervenant | null> {
    const found = await this.prisma.intervenant.findUnique({
      where: { email: email.value }, // Utilise la valeur du VO
    });
    return found ? IntervenantMapper.toDomain(found) : null;
  }

  // ... autres méthodes
}
```

### Annotations importantes

| Annotation | Rôle |
|------------|------|
| `@Injectable()` | Permet à NestJS d'injecter cette classe |
| `implements IntervenantRepository` | Garantit le respect du contrat Domain |

---

## 3. Configuration NestJS (Module)

### Le problème à résoudre

Comment dire à NestJS : "Quand quelqu'un demande `IntervenantRepository`, donne-lui `PrismaIntervenantRepository`" ?

### La solution : Provider avec token

```typescript
// intervenant.module.ts
import { Module } from '@nestjs/common';
import { INTERVENANT_REPOSITORY } from './domain';
import { PrismaIntervenantRepository } from './infrastructure';

@Module({
  providers: [
    {
      provide: INTERVENANT_REPOSITORY,       // Le TOKEN (Symbol)
      useClass: PrismaIntervenantRepository, // L'implémentation
    },
  ],
  exports: [INTERVENANT_REPOSITORY],
})
export class IntervenantModule {}
```

### Comment ça fonctionne

```
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS DI Container                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Module enregistre :                                         │
│     INTERVENANT_REPOSITORY → PrismaIntervenantRepository        │
│                                                                  │
│  2. Service demande :                                           │
│     @Inject(INTERVENANT_REPOSITORY)                             │
│     private repo: IntervenantRepository                         │
│                                                                  │
│  3. NestJS injecte :                                            │
│     new PrismaIntervenantRepository(prismaService)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Utilisation dans un Service (aperçu Phase 4)

```typescript
@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,
    //              ↑ Interface du Domain
    //              NestJS injecte PrismaIntervenantRepository
  ) {}

  async create(dto: CreateIntervenantDto) {
    const intervenant = Intervenant.create({
      nom: dto.nom,
      email: dto.email,
      specialite: dto.specialite,
    });

    return this.repository.save(intervenant);
    //          ↑ Appelle PrismaIntervenantRepository.save()
  }
}
```

---

## 4. Requêtes métier spécifiques

Le Repository peut inclure des **méthodes de requête métier** qui ne sont pas du simple CRUD.

### Exemple : MissionRepository

```typescript
export interface MissionRepository {
  // CRUD standard
  save(mission: Mission): Promise<Mission>;
  findById(id: number): Promise<Mission | null>;
  findAll(): Promise<Mission[]>;
  delete(id: number): Promise<void>;

  // Requêtes MÉTIER
  findByIntervenantId(intervenantId: number): Promise<Mission[]>;
  findUnassigned(): Promise<Mission[]>;
  findUpcoming(): Promise<Mission[]>;
  findByDateRange(start: Date, end: Date): Promise<Mission[]>;
  hasConflict(intervenantId: number, date: Date): Promise<boolean>;
}
```

### Implémentation de `hasConflict`

```typescript
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

  const conflicting = await this.prisma.mission.findFirst({
    where: {
      intervenantId,
      date: { gte: startOfDay, lte: endOfDay },
      ...(excludeMissionId && { id: { not: excludeMissionId } }),
    },
  });

  return conflicting !== null;
}
```

---

## 5. Avantages de cette architecture

### Testabilité

```typescript
// En test, on peut créer un MockRepository
class MockIntervenantRepository implements IntervenantRepository {
  private data: Intervenant[] = [];

  async save(intervenant: Intervenant): Promise<Intervenant> {
    this.data.push(intervenant);
    return intervenant;
  }

  async findById(id: number): Promise<Intervenant | null> {
    return this.data.find(i => i.id === id) ?? null;
  }
  // ...
}

// Et l'injecter dans les tests
const service = new IntervenantService(new MockIntervenantRepository());
```

### Flexibilité

```typescript
// Changer d'implémentation sans toucher au Domain
@Module({
  providers: [
    {
      provide: INTERVENANT_REPOSITORY,
      useClass: process.env.USE_MOCK
        ? MockIntervenantRepository      // Pour les tests
        : PrismaIntervenantRepository,   // Pour la prod
    },
  ],
})
```

---

## 6. Résumé

| Composant | Rôle | Couche |
|-----------|------|--------|
| `IntervenantRepository` (interface) | Définit le contrat | Domain (PORT) |
| `PrismaIntervenantRepository` (classe) | Implémente le contrat | Infrastructure (ADAPTER) |
| `IntervenantMapper` | Convertit Domain ↔ Prisma | Infrastructure |
| `IntervenantModule` | Configure l'injection | Infrastructure |
| `INTERVENANT_REPOSITORY` (Symbol) | Token pour l'injection | Domain |

---

## Prochaine étape : Phase 4

Dans la Phase 4 (Application), nous allons créer :

1. **DTOs** - Objets de transfert pour valider les entrées API
2. **Services** - Orchestration des use cases
3. **Controllers** - Points d'entrée REST API

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   HTTP Request                                                   │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │ Controller  │────►│  Service    │────►│ Repository  │      │
│   │ (validation)│     │ (use case)  │     │ (persist)   │      │
│   └─────────────┘     └─────────────┘     └─────────────┘      │
│        │                    │                    │               │
│        │                    │                    │               │
│   DTO + class-validator   Entity            Mapper + Prisma     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
