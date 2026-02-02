# 📚 Phase 1 - Comprendre les Fondations

## Table des matières
1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture NestJS](#architecture-nestjs)
3. [L'injection de dépendances](#linjection-de-dépendances)
4. [Prisma ORM](#prisma-orm)
5. [Docker et l'infrastructure](#docker-et-linfrastructure)
6. [Récapitulatif du flux de données](#récapitulatif-du-flux-de-données)

---

## Vue d'ensemble du projet

### Structure du Monorepo

```
cours_nestjs/
├── backend/                 # API NestJS
│   ├── src/                 # Code source
│   ├── prisma/              # Schéma et migrations BDD
│   └── package.json
├── frontend/                # Interface React
│   ├── src/
│   └── package.json
├── docker-compose.yml       # Infrastructure (PostgreSQL, RabbitMQ)
└── docs/                    # Documentation (vous êtes ici!)
```

### Pourquoi un Monorepo ?

Un **monorepo** regroupe plusieurs projets (backend, frontend) dans un seul dépôt git.

**Avantages :**
- 🔄 Synchronisation facile entre frontend et backend
- 📦 Partage de types TypeScript possible
- 🚀 Un seul `git clone` pour tout le projet
- 📋 Historique unifié des changements

---

## Architecture NestJS

### Le pattern MVC adapté

NestJS s'inspire du pattern **MVC** (Model-View-Controller) mais l'adapte pour les APIs :

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP Request (GET /intervenants)
┌─────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  @Controller('intervenants')                             │    │
│  │  class IntervenantController {                           │    │
│  │    @Get() findAll() { ... }   ◄── Route HTTP             │    │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Rôle: Recevoir les requêtes, valider, déléguer au Service      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Appel de méthode
┌─────────────────────────────────────────────────────────────────┐
│                          SERVICE                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  @Injectable()                                           │    │
│  │  class IntervenantService {                              │    │
│  │    findAll() { return this.prisma.intervenant.findMany() }│   │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Rôle: Logique métier, accès aux données                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Requête SQL
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES (PostgreSQL)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Les 3 composants clés

#### 1. Module (`@Module`)

Un **module** est un conteneur qui organise le code. C'est comme une boîte qui regroupe des fonctionnalités liées.

```typescript
// app.module.ts
@Module({
  imports: [        // Modules dont on dépend
    ConfigModule,
    PrismaModule,
  ],
  controllers: [    // Controllers de ce module
    AppController,
  ],
  providers: [      // Services de ce module
    AppService,
  ],
})
export class AppModule {}
```

**Analogie :** Un module est comme un **département** dans une entreprise. Le département RH (IntervenantModule) contient ses propres employés (services) et points de contact (controllers).

#### 2. Controller (`@Controller`)

Un **controller** gère les requêtes HTTP entrantes.

```typescript
@Controller('intervenants')  // Préfixe de route: /intervenants
export class IntervenantController {

  @Get()           // GET /intervenants
  findAll() { }

  @Get(':id')      // GET /intervenants/123
  findOne(@Param('id') id: string) { }

  @Post()          // POST /intervenants
  create(@Body() data: CreateDto) { }
}
```

**Décorateurs de paramètres :**
| Décorateur | Source | Exemple |
|------------|--------|---------|
| `@Body()` | Corps de la requête | `{ "nom": "Jean" }` |
| `@Param('id')` | URL `/users/:id` | `123` |
| `@Query('search')` | Query string `?search=x` | `x` |
| `@Headers('auth')` | En-têtes HTTP | `Bearer token...` |

#### 3. Service (`@Injectable`)

Un **service** contient la logique métier. Il est **injectable** dans d'autres classes.

```typescript
@Injectable()
export class IntervenantService {
  constructor(private prisma: PrismaService) {}
  //          ▲
  //          └── Injection de dépendance automatique!

  findAll() {
    return this.prisma.intervenant.findMany();
  }
}
```

---

## L'injection de dépendances

### Qu'est-ce que c'est ?

L'**injection de dépendances (DI)** est un pattern où les objets reçoivent leurs dépendances au lieu de les créer eux-mêmes.

### Sans DI (❌ Mauvaise pratique)

```typescript
class IntervenantService {
  private prisma: PrismaClient;

  constructor() {
    // Le service CRÉE sa propre dépendance
    this.prisma = new PrismaClient();  // ❌ Couplage fort!
  }
}

// Problèmes:
// - Impossible de mocker PrismaClient pour les tests
// - Chaque instance crée sa propre connexion BDD
// - Difficile de changer l'implémentation
```

### Avec DI (✅ Bonne pratique)

```typescript
@Injectable()
class IntervenantService {
  // Le service REÇOIT sa dépendance
  constructor(private prisma: PrismaService) {}  // ✅ Injection!
}

// Avantages:
// - NestJS gère la création et le cycle de vie
// - Facile à mocker pour les tests
// - Une seule instance partagée (Singleton)
```

### Comment ça fonctionne ?

```
┌────────────────────────────────────────────────────────────────┐
│                    CONTENEUR D'INJECTION                        │
│                         (IoC Container)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Registre des providers:                                  │  │
│  │                                                           │  │
│  │  PrismaService ──────► Instance unique (Singleton)        │  │
│  │  ConfigService ──────► Instance unique                    │  │
│  │  AppService ─────────► Instance unique                    │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
         Quand un service demande une dépendance...
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  class IntervenantService {                                     │
│    constructor(private prisma: PrismaService) { }               │
│  }                          ▲                                   │
│                             │                                   │
│             NestJS injecte automatiquement                      │
│             l'instance depuis le conteneur                      │
└────────────────────────────────────────────────────────────────┘
```

### Le décorateur `@Global()`

```typescript
@Global()  // Rend le module disponible PARTOUT
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Sans `@Global()` :**
```typescript
// Chaque module doit importer PrismaModule
@Module({
  imports: [PrismaModule],  // Obligatoire dans chaque module!
})
export class IntervenantModule {}
```

**Avec `@Global()` :**
```typescript
// PrismaService est disponible partout automatiquement
@Module({
  imports: [],  // Pas besoin d'importer PrismaModule
})
export class IntervenantModule {}
```

---

## Prisma ORM

### Qu'est-ce qu'un ORM ?

Un **ORM** (Object-Relational Mapping) fait le pont entre vos objets TypeScript et les tables SQL.

```
┌──────────────────────┐      ┌──────────────────────┐
│   CODE TYPESCRIPT    │      │   BASE DE DONNÉES    │
│                      │      │                      │
│  intervenant = {     │ ───► │  INSERT INTO         │
│    nom: "Marie",     │      │  intervenants        │
│    email: "m@x.com"  │      │  (nom, email)        │
│  }                   │      │  VALUES (...)        │
└──────────────────────┘      └──────────────────────┘
```

### Le fichier schema.prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"  // Génère le client TypeScript
}

datasource db {
  provider = "postgresql"  // Type de BDD
}

model Intervenant {
  id         Int       @id @default(autoincrement())
  //         │         │   └── Valeur par défaut: auto-incrément
  //         │         └── Clé primaire
  //         └── Type: entier

  nom        String
  email      String    @unique   // Contrainte d'unicité
  telephone  String?             // ? = nullable (optionnel)
  specialite String

  missions   Mission[]           // Relation: liste de missions
  //         └── Un intervenant a 0 ou N missions

  @@map("intervenants")          // Nom de la table en BDD
}

model Mission {
  id            Int          @id @default(autoincrement())
  titre         String
  date          DateTime
  duree         Int
  lieu          String

  intervenant   Intervenant? @relation(fields: [intervenantId], references: [id])
  intervenantId Int?
  //            │
  //            └── Clé étrangère vers Intervenant

  @@map("missions")
}
```

### Relations entre modèles

```
┌─────────────────────┐         ┌─────────────────────┐
│    INTERVENANT      │         │      MISSION        │
├─────────────────────┤         ├─────────────────────┤
│ id: 1               │◄────────│ intervenantId: 1    │
│ nom: "Marie"        │    │    │ titre: "Cours JS"   │
│ email: "m@x.com"    │    │    │ date: 2024-03-15    │
│ specialite: "JS"    │    │    └─────────────────────┘
└─────────────────────┘    │
                           │    ┌─────────────────────┐
                           └────│ intervenantId: 1    │
                                │ titre: "Cours React"│
                                │ date: 2024-03-20    │
                                └─────────────────────┘

Relation ONE-TO-MANY:
- Un Intervenant peut avoir PLUSIEURS Missions
- Une Mission appartient à UN SEUL Intervenant (ou aucun si intervenantId est null)
```

### Utilisation du client Prisma

```typescript
// Créer un intervenant
const marie = await prisma.intervenant.create({
  data: {
    nom: "Marie Dupont",
    email: "marie@example.com",
    specialite: "JavaScript"
  }
});

// Lire tous les intervenants avec leurs missions
const intervenants = await prisma.intervenant.findMany({
  include: { missions: true }  // Charge aussi les missions liées
});

// Rechercher par critères
const jsExperts = await prisma.intervenant.findMany({
  where: {
    specialite: { contains: "JavaScript" }
  }
});

// Mettre à jour
await prisma.intervenant.update({
  where: { id: 1 },
  data: { telephone: "0612345678" }
});

// Supprimer
await prisma.intervenant.delete({
  where: { id: 1 }
});
```

### Les migrations Prisma

Les **migrations** versionnent les changements de schéma de base de données.

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW PRISMA                           │
│                                                             │
│  1. Modifier schema.prisma                                  │
│     │                                                       │
│     ▼                                                       │
│  2. npx prisma migrate dev --name "add_phone_field"         │
│     │                                                       │
│     ├──► Génère: prisma/migrations/20240315_add_phone/      │
│     │            └── migration.sql                          │
│     │                                                       │
│     └──► Applique le SQL sur la base de données             │
│                                                             │
│  3. npx prisma generate                                     │
│     │                                                       │
│     └──► Régénère le client TypeScript avec les nouveaux    │
│          types                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Docker et l'infrastructure

### Pourquoi Docker ?

Docker permet de lancer des services (PostgreSQL, RabbitMQ) de manière **isolée** et **reproductible**.

```
┌─────────────────────────────────────────────────────────────┐
│                     VOTRE MACHINE                            │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   CONTAINER     │  │   CONTAINER     │                   │
│  │   PostgreSQL    │  │   RabbitMQ      │                   │
│  │                 │  │                 │                   │
│  │   Port: 5432    │  │   Ports: 5672,  │                   │
│  │                 │  │          15672  │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │              VOLUMES DOCKER              │                │
│  │  (Données persistées sur le disque)     │                │
│  │                                         │                │
│  │  postgres_data/    rabbitmq_data/       │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Le fichier docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:15           # Image officielle PostgreSQL
    container_name: cours_nestjs_postgres
    environment:
      POSTGRES_DB: cours_nestjs   # Nom de la BDD créée au démarrage
      POSTGRES_USER: postgres     # Utilisateur
      POSTGRES_PASSWORD: postgres # Mot de passe
    ports:
      - "5432:5432"              # Port local:port container
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persistance

  rabbitmq:
    image: rabbitmq:3-management  # RabbitMQ avec interface web
    ports:
      - "5672:5672"    # Port AMQP (protocole de messages)
      - "15672:15672"  # Interface web de management

volumes:
  postgres_data:    # Volume nommé pour PostgreSQL
  rabbitmq_data:    # Volume nommé pour RabbitMQ
```

### Commandes Docker utiles

```bash
# Démarrer les services en arrière-plan
docker compose up -d

# Voir les logs
docker compose logs -f postgres

# Arrêter les services
docker compose down

# Arrêter ET supprimer les données
docker compose down -v
```

---

## Récapitulatif du flux de données

### Cycle de vie d'une requête HTTP

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. CLIENT envoie: GET http://localhost:3000/intervenants            │
│     │                                                                │
│     ▼                                                                │
│  2. NestJS reçoit la requête                                         │
│     │                                                                │
│     ▼                                                                │
│  3. ROUTING: trouve @Controller('intervenants') + @Get()             │
│     │                                                                │
│     ▼                                                                │
│  4. CONTROLLER.findAll() est appelé                                  │
│     │                                                                │
│     │   Le controller a besoin de IntervenantService                 │
│     │   NestJS l'INJECTE automatiquement via le constructeur         │
│     │                                                                │
│     ▼                                                                │
│  5. SERVICE.findAll() est appelé                                     │
│     │                                                                │
│     │   Le service a besoin de PrismaService                         │
│     │   NestJS l'INJECTE automatiquement                             │
│     │                                                                │
│     ▼                                                                │
│  6. PRISMA exécute: SELECT * FROM intervenants                       │
│     │                                                                │
│     ▼                                                                │
│  7. PostgreSQL retourne les données                                  │
│     │                                                                │
│     ▼                                                                │
│  8. Les données remontent: Prisma → Service → Controller             │
│     │                                                                │
│     ▼                                                                │
│  9. NestJS sérialise en JSON et envoie la réponse HTTP               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Diagramme des fichiers actuels

```
backend/src/
│
├── main.ts                          # Point d'entrée
│   └── Crée l'app NestJS depuis AppModule
│
├── app.module.ts                    # Module racine
│   ├── imports: [ConfigModule, PrismaModule]
│   ├── controllers: [AppController]
│   └── providers: [AppService]
│
├── app.controller.ts                # Controller par défaut
│   └── @Get() getHello()
│
├── app.service.ts                   # Service par défaut
│   └── getHello(): string
│
└── shared/
    └── infrastructure/
        └── prisma/
            ├── prisma.module.ts     # Module Prisma (@Global)
            ├── prisma.service.ts    # Service Prisma (connexion BDD)
            └── index.ts             # Barrel export
```

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **Décorateur** | Fonction qui ajoute des métadonnées à une classe/méthode (`@Module`, `@Injectable`) |
| **Provider** | Tout ce qui peut être injecté (services, repositories, factories) |
| **Module** | Conteneur qui organise providers et controllers |
| **Singleton** | Instance unique partagée dans toute l'application |
| **ORM** | Mapping objet-relationnel (TypeScript ↔ SQL) |
| **Migration** | Script SQL versionné pour modifier le schéma BDD |
| **Container IoC** | Gestionnaire central qui crée et injecte les dépendances |

---

## Exercice de vérification

Pour valider votre compréhension, essayez de répondre :

1. **Pourquoi utilise-t-on `@Injectable()` sur un service ?**

2. **Quelle est la différence entre `imports` et `providers` dans un module ?**

3. **Pourquoi `PrismaModule` est marqué `@Global()` ?**

4. **Que fait `prisma migrate dev` ?**

5. **Comment NestJS sait-il quel service injecter dans un constructeur ?**

<details>
<summary>Voir les réponses</summary>

1. `@Injectable()` indique à NestJS que cette classe peut être gérée par le conteneur d'injection et injectée dans d'autres classes.

2. `imports` = autres modules dont on dépend. `providers` = services créés DANS ce module.

3. Pour éviter de l'importer dans chaque module qui a besoin de la base de données.

4. Génère un fichier SQL de migration, l'applique sur la BDD, et régénère le client TypeScript.

5. NestJS utilise le **type TypeScript** du paramètre. `constructor(private prisma: PrismaService)` → il cherche un provider de type `PrismaService`.

</details>

---

## Prochaine étape

Dans la **Phase 2**, nous allons implémenter la **couche Domain** en DDD :
- Créer des **Entities** avec logique métier
- Utiliser des **Value Objects** pour la validation
- Définir des **Ports** (interfaces) pour découpler le domaine de l'infrastructure

Cela vous permettra de comprendre comment séparer la logique métier de la technique.
