# 🏗️ Architecture Cible - DDD / Hexagonale

Ce document explique l'architecture que nous allons construire dans les prochaines phases.

---

## Pourquoi cette architecture ?

### Le problème avec l'approche classique

Dans une architecture classique NestJS, tout est mélangé :

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE CLASSIQUE                    │
│                                                             │
│  Controller ──► Service ──► Prisma ──► PostgreSQL           │
│                    │                                        │
│                    └── Logique métier + Accès BDD mélangés  │
│                                                             │
│  Problèmes:                                                 │
│  ❌ Difficile à tester (dépend de la vraie BDD)             │
│  ❌ Logique métier dispersée                                │
│  ❌ Couplage fort avec Prisma                               │
│  ❌ Difficile de changer d'ORM ou de BDD                    │
└─────────────────────────────────────────────────────────────┘
```

### La solution : Architecture Hexagonale

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ARCHITECTURE HEXAGONALE                            │
│                                                                     │
│                    ┌─────────────────────┐                          │
│                    │       DOMAIN        │  ◄── Cœur métier pur     │
│                    │   (Entities, VOs,   │      Aucune dépendance   │
│                    │    Domain Events)   │      externe             │
│                    └──────────┬──────────┘                          │
│                               │                                     │
│              Définit des INTERFACES (Ports)                         │
│                               │                                     │
│         ┌─────────────────────┼─────────────────────┐               │
│         │                     │                     │               │
│         ▼                     ▼                     ▼               │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐          │
│  │   ADAPTER   │      │   ADAPTER   │      │   ADAPTER   │          │
│  │   Prisma    │      │  RabbitMQ   │      │ OpenRouter  │          │
│  │             │      │             │      │     AI      │          │
│  └─────────────┘      └─────────────┘      └─────────────┘          │
│                                                                     │
│  ✅ Domain testable sans BDD réelle                                 │
│  ✅ Logique métier centralisée                                      │
│  ✅ Facile de changer d'implémentation (Prisma → TypeORM)           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Les 3 couches de l'architecture

### Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         PRESENTATION                                │  │
│  │                    (Controllers, DTOs API)                          │  │
│  │  Rôle: Interface avec le monde extérieur (HTTP, WebSocket)          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                          APPLICATION                                │  │
│  │              (Use Cases, Commands, Queries, Services)               │  │
│  │  Rôle: Orchestrer les opérations, coordonner le Domain              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                            DOMAIN                                   │  │
│  │         (Entities, Value Objects, Domain Events, Ports)             │  │
│  │  Rôle: Contenir TOUTE la logique métier                             │  │
│  │  ⚠️  AUCUNE dépendance vers l'extérieur!                            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                     │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         INFRASTRUCTURE                              │  │
│  │              (Repositories Prisma, RabbitMQ Publisher)              │  │
│  │  Rôle: Implémenter les PORTS définis par le Domain                  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Règle de dépendance

```
     Les dépendances pointent TOUJOURS vers le centre (Domain)

                          Infrastructure
                               │
                               │ implémente
                               ▼
     Presentation ───────► Application ───────► DOMAIN
                               │
                               │ utilise
                               ▼
                          Infrastructure

     ❌ Le Domain ne connaît PAS Prisma
     ❌ Le Domain ne connaît PAS RabbitMQ
     ❌ Le Domain ne connaît PAS les Controllers
     ✅ Le Domain définit des INTERFACES (Ports)
     ✅ L'Infrastructure IMPLÉMENTE ces interfaces (Adapters)
```

---

## Concepts DDD

### Entity (Entité)

Une **Entity** a une **identité** qui persiste dans le temps.

```typescript
// ❌ Modèle anémique (mauvaise pratique)
class Intervenant {
  id: number;
  nom: string;
  email: string;
  // Juste des données, pas de comportement
}

// ✅ Entity riche (bonne pratique DDD)
class Intervenant {
  private constructor(
    private readonly _id: IntervenantId,
    private _nom: string,
    private _email: Email,           // Value Object
    private _specialite: Specialite, // Value Object
  ) {}

  // Factory method avec validation
  static create(props: CreateIntervenantProps): Intervenant {
    // Validation métier ICI
    if (!props.nom || props.nom.length < 2) {
      throw new Error("Le nom doit avoir au moins 2 caractères");
    }
    return new Intervenant(/* ... */);
  }

  // Méthodes métier avec comportement
  changerEmail(nouvelEmail: Email): void {
    this._email = nouvelEmail;
    this.addDomainEvent(new EmailChangedEvent(this._id, nouvelEmail));
  }

  // Encapsulation: accès contrôlé aux données
  get email(): Email {
    return this._email;
  }
}
```

**Deux intervenants sont égaux si leur `id` est identique**, même si les autres propriétés diffèrent.

### Value Object (Objet Valeur)

Un **Value Object** n'a pas d'identité. Il est défini uniquement par ses attributs.

```typescript
// ✅ Value Object Email
class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    // Validation au moment de la création
    if (!email.includes('@')) {
      throw new Error("Email invalide");
    }
    return new Email(email.toLowerCase());
  }

  // Deux emails sont égaux si leur valeur est identique
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// Utilisation
const email1 = Email.create("Test@Example.com");  // Normalisé en minuscules
const email2 = Email.create("test@example.com");

email1.equals(email2);  // true - même valeur
```

**Avantages des Value Objects :**
- ✅ Validation centralisée (jamais d'email invalide dans le système)
- ✅ Immutables (pas de modification accidentelle)
- ✅ Auto-documentés (le type `Email` est plus clair que `string`)

### Domain Event (Événement Domaine)

Un **Domain Event** représente quelque chose d'important qui s'est passé dans le domaine.

```typescript
// Événement: un intervenant a été créé
class IntervenantCreatedEvent {
  constructor(
    public readonly intervenantId: IntervenantId,
    public readonly nom: string,
    public readonly email: Email,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

// L'Entity émet des événements
class Intervenant {
  private domainEvents: DomainEvent[] = [];

  static create(props: CreateIntervenantProps): Intervenant {
    const intervenant = new Intervenant(/* ... */);

    // Émettre un événement
    intervenant.addDomainEvent(
      new IntervenantCreatedEvent(intervenant.id, props.nom, props.email)
    );

    return intervenant;
  }
}
```

Ces événements seront ensuite publiés vers **RabbitMQ** pour être traités de manière asynchrone.

### Port (Interface)

Un **Port** est une interface qui définit un contrat. Le Domain définit CE DONT il a besoin, sans savoir COMMENT c'est implémenté.

```typescript
// Port défini dans le DOMAIN (pas de mention de Prisma!)
interface IntervenantRepository {
  save(intervenant: Intervenant): Promise<void>;
  findById(id: IntervenantId): Promise<Intervenant | null>;
  findByEmail(email: Email): Promise<Intervenant | null>;
  findAll(): Promise<Intervenant[]>;
  delete(id: IntervenantId): Promise<void>;
}
```

### Adapter (Implémentation)

Un **Adapter** implémente un Port avec une technologie spécifique.

```typescript
// Adapter dans INFRASTRUCTURE (implémente le Port avec Prisma)
@Injectable()
class PrismaIntervenantRepository implements IntervenantRepository {
  constructor(private prisma: PrismaService) {}

  async save(intervenant: Intervenant): Promise<void> {
    const data = IntervenantMapper.toPersistence(intervenant);
    await this.prisma.intervenant.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async findById(id: IntervenantId): Promise<Intervenant | null> {
    const data = await this.prisma.intervenant.findUnique({
      where: { id: id.value }
    });
    return data ? IntervenantMapper.toDomain(data) : null;
  }

  // ... autres méthodes
}
```

---

## Structure des dossiers finale

```
backend/src/modules/intervenant/
│
├── domain/                           # 🎯 CŒUR MÉTIER
│   ├── entities/
│   │   └── intervenant.entity.ts     # Entity avec logique métier
│   ├── value-objects/
│   │   ├── email.vo.ts               # Value Object Email
│   │   └── specialite.vo.ts          # Value Object Specialite
│   ├── events/
│   │   ├── intervenant-created.event.ts
│   │   └── intervenant-updated.event.ts
│   ├── repositories/
│   │   └── intervenant.repository.interface.ts  # PORT (interface)
│   └── services/
│       └── intervenant-domain.service.ts  # Logique métier complexe
│
├── application/                      # 🎭 ORCHESTRATION
│   ├── commands/
│   │   ├── create-intervenant.command.ts
│   │   └── create-intervenant.handler.ts
│   ├── queries/
│   │   ├── get-intervenants.query.ts
│   │   └── get-intervenants.handler.ts
│   ├── dtos/
│   │   ├── create-intervenant.dto.ts
│   │   └── intervenant-response.dto.ts
│   └── services/
│       └── intervenant.service.ts
│
├── infrastructure/                   # 🔧 TECHNIQUE
│   ├── persistence/
│   │   ├── prisma-intervenant.repository.ts  # ADAPTER (implémente le port)
│   │   └── intervenant.mapper.ts     # Convertit Domain ↔ BDD
│   └── messaging/
│       └── intervenant-events.publisher.ts
│
├── presentation/                     # 🌐 API
│   └── intervenant.controller.ts
│
└── intervenant.module.ts             # Module NestJS qui assemble tout
```

---

## Flux de données avec l'architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  POST /intervenants  { "nom": "Marie", "email": "marie@x.com" }        │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION: IntervenantController                                   │
│  - Reçoit la requête HTTP                                              │
│  - Valide le DTO (format des données)                                  │
│  - Crée une Command                                                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  APPLICATION: CreateIntervenantHandler                                 │
│  - Exécute le use case "créer un intervenant"                          │
│  - Utilise le Repository (via l'interface/Port)                        │
│  - Publie les Domain Events                                            │
└────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  DOMAIN          │    │  DOMAIN          │    │  DOMAIN          │
│  Email.create()  │    │  Intervenant     │    │  IntervenantRepo │
│  Valide l'email  │    │  .create()       │    │  (INTERFACE)     │
└──────────────────┘    │  Crée l'entity   │    └────────┬─────────┘
                        │  + émet Event    │             │
                        └──────────────────┘             │
                                                         │
                              L'Application utilise      │
                              l'interface, pas Prisma    │
                                                         │
                                                         ▼
                        ┌────────────────────────────────────────────┐
                        │  INFRASTRUCTURE: PrismaIntervenantRepo     │
                        │  - Implémente l'interface                  │
                        │  - Utilise Prisma pour persister           │
                        │  - Convertit avec le Mapper                │
                        └────────────────────────────────────────────┘
                                         │
                                         ▼
                        ┌────────────────────────────────────────────┐
                        │  PostgreSQL: INSERT INTO intervenants ...  │
                        └────────────────────────────────────────────┘
```

---

## Comparaison: Avec vs Sans DDD

| Aspect | Sans DDD | Avec DDD |
|--------|----------|----------|
| **Validation email** | Éparpillée dans controllers/services | Centralisée dans `Email` Value Object |
| **Tests** | Nécessitent une vraie BDD | Domain testable sans BDD |
| **Changement d'ORM** | Modifications partout | Seulement dans l'Adapter |
| **Logique métier** | Mélangée avec le code technique | Isolée dans le Domain |
| **Complexité initiale** | Faible | Plus élevée |
| **Maintenabilité long terme** | Difficile | Excellente |

---

## Quand utiliser cette architecture ?

### ✅ Recommandé pour :
- Applications avec logique métier complexe
- Projets à long terme avec évolutions fréquentes
- Équipes multiples travaillant sur le même code
- Besoin de haute testabilité

### ❌ Peut être overkill pour :
- Prototypes rapides
- CRUD simples sans logique métier
- Projets très courts

Notre projet de gestion d'intervenants et missions est un **bon candidat** car :
- Règles métier réelles (contraintes sur les missions, disponibilités)
- Intégration IA qui nécessite un découplage propre
- Événements entre modules (mission assignée → notifier l'intervenant)

---

## Prochaines étapes

Dans les phases suivantes, nous allons construire cette architecture couche par couche :

1. **Phase 2** : Domain (Entities, Value Objects, Events, Ports)
2. **Phase 3** : Infrastructure (Repositories Prisma, Mappers)
3. **Phase 4** : Application (Commands, Queries, Services)
4. **Phase 5** : Events (RabbitMQ)

Chaque phase vous permettra de comprendre une couche en profondeur avant de passer à la suivante.
