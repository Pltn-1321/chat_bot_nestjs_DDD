# Architecture Hexagonale - Analyse Avant/Après

## Introduction

Ce document analyse la transformation de l'architecture du projet d'une **architecture en couches (Layered)** vers une **véritable architecture hexagonale (Ports & Adapters)**.

---

## Qu'est-ce que l'Architecture Hexagonale ?

L'architecture hexagonale, créée par **Alistair Cockburn** en 2005, est aussi appelée **Ports & Adapters**. Son principe fondamental :

> **"Permettre à une application d'être pilotée de manière égale par des utilisateurs, des programmes, des tests automatisés ou des scripts batch, et d'être développée et testée en isolation de ses éventuels dispositifs d'exécution et bases de données."**

### Les Concepts Clés

```
                    ┌─────────────────────────────────────┐
                    │         ADAPTATEURS PRIMAIRES       │
                    │    (Driving - Pilotent l'appli)     │
                    │  REST API, CLI, Tests, GraphQL...   │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────────┐
                    │          PORTS PRIMAIRES             │
                    │    (Interfaces des Use Cases)        │
                    └──────────────┬───────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        │    ┌─────────────────────▼─────────────────────┐    │
        │    │                                           │    │
        │    │           APPLICATION LAYER               │    │
        │    │         (Orchestration Use Cases)         │    │
        │    │                                           │    │
        │    └─────────────────────┬─────────────────────┘    │
        │                          │                          │
        │    ┌─────────────────────▼─────────────────────┐    │
        │    │                                           │    │
        │    │              DOMAIN LAYER                 │    │
        │    │   (Entités, Value Objects, Règles Métier) │    │
        │    │                                           │    │
        │    │              ⬡ HEXAGONE ⬡                 │    │
        │    │         (Cœur indépendant)                │    │
        │    │                                           │    │
        │    └─────────────────────┬─────────────────────┘    │
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │          PORTS SECONDAIRES           │
                    │  (Interfaces vers l'extérieur)       │
                    │  Repository, EventPublisher, AI...   │
                    └──────────────┬───────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────┐
                    │       ADAPTATEURS SECONDAIRES       │
                    │     (Driven - Pilotés par l'appli)  │
                    │   Prisma, RabbitMQ, LangChain...    │
                    └─────────────────────────────────────┘
```

### Règle d'Or : Direction des Dépendances

```
Infrastructure ──────► Domain ◄────── Application ◄────── Presentation
     │                   ▲                                      │
     │                   │                                      │
     └───────────────────┴──────────────────────────────────────┘
                    TOUT POINTE VERS LE DOMAIN
```

---

## État AVANT : Architecture en Couches

### Structure des Dossiers (Avant)

```
backend/src/
├── shared/
│   ├── domain/
│   │   ├── entity.base.ts
│   │   ├── value-object.base.ts
│   │   └── domain-event.base.ts
│   └── infrastructure/
│       ├── prisma/
│       │   └── prisma.service.ts
│       └── messaging/
│           └── event-bus.service.ts      # ❌ Pas d'interface
│
├── modules/
│   ├── intervenant/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── repositories/
│   │   │       └── intervenant.repository.interface.ts  ✅
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   └── intervenant.service.ts  # ❌ Dépend de EventBusService concret
│   │   │   └── dtos/                        # ❌ DTOs dans Application
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── mission/
│   │   └── (même structure qu'intervenant)
│   │
│   └── chat/
│       ├── application/
│       │   └── services/
│       │       └── chat.service.ts    # ❌ Dépend directement de Prisma
│       ├── infrastructure/
│       │   └── ai/
│       │       └── langchain-agent.service.ts
│       ├── presentation/
│       └── (PAS DE DOMAIN!)              # ❌ Violation majeure
```

### Problèmes Identifiés

#### 1. Couplage Application → Infrastructure

```typescript
// ❌ AVANT: intervenant.service.ts
import { EventBusService } from '../../../../shared/infrastructure/messaging';

@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,  // ✅ Interface
    private readonly eventBus: EventBusService,          // ❌ Classe concrète
  ) {}
}
```

**Problème** : `EventBusService` est une implémentation concrète liée à RabbitMQ. Si on veut changer de système de messaging (Kafka, SQS, etc.), il faut modifier la couche Application.

#### 2. Module Chat Sans Domain

```typescript
// ❌ AVANT: chat.service.ts
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,              // ❌ Infrastructure directe
    private readonly agentService: LangChainAgentService, // ❌ Infrastructure directe
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<...> {
    // Appels directs à Prisma
    const conversation = await this.prisma.client.conversation.create({...});
    const message = await this.prisma.client.message.create({...});
  }
}
```

**Problème** : Aucune abstraction. Impossible de tester sans base de données. Pas de logique métier encapsulée.

#### 3. Exceptions Framework dans Application

```typescript
// ❌ AVANT: intervenant.service.ts
import { NotFoundException, ConflictException } from '@nestjs/common';

async findById(id: number): Promise<IntervenantResponseDto> {
  const intervenant = await this.repository.findById(id);
  if (!intervenant) {
    throw new NotFoundException(`Intervenant #${id} non trouvé`);  // ❌ NestJS
  }
}
```

**Problème** : La couche Application est couplée à NestJS. Si on veut utiliser un autre framework (Fastify, Express pur), il faut modifier le code métier.

#### 4. Pas de Ports Explicites

Le projet n'a pas de structure `ports/` claire. Les interfaces sont dispersées dans `repositories/` uniquement.

---

## État APRÈS : Architecture Hexagonale

### Structure des Dossiers (Après)

```
backend/src/
├── shared/
│   ├── domain/
│   │   ├── base/
│   │   │   ├── entity.base.ts
│   │   │   ├── value-object.base.ts
│   │   │   └── domain-event.base.ts
│   │   ├── ports/                           # 🆕 PORTS PARTAGÉS
│   │   │   └── event-publisher.port.ts
│   │   └── exceptions/                      # 🆕 EXCEPTIONS DOMAIN
│   │       ├── domain.exception.ts
│   │       ├── entity-not-found.exception.ts
│   │       └── business-rule-violation.exception.ts
│   ├── infrastructure/
│   │   ├── prisma/
│   │   └── messaging/
│   │       └── rabbitmq-event-publisher.adapter.ts  # 🔄 Renommé (Adapter)
│   └── presentation/
│       └── filters/                         # 🆕 FILTRES EXCEPTIONS
│           └── domain-exception.filter.ts
│
├── modules/
│   ├── intervenant/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── ports/                       # 🔄 Renommé depuis repositories/
│   │   │       └── intervenant.repository.port.ts
│   │   ├── application/
│   │   │   ├── use-cases/                   # 🆕 USE CASES (optionnel)
│   │   │   └── services/
│   │   ├── infrastructure/
│   │   │   └── adapters/                    # 🔄 Renommé depuis persistence/
│   │   │       └── prisma-intervenant.adapter.ts
│   │   └── presentation/
│   │       ├── controllers/
│   │       └── dtos/                        # 🔄 Déplacé depuis application/
│   │
│   └── chat/
│       ├── domain/                          # 🆕 NOUVEAU DOMAIN
│       │   ├── entities/
│       │   │   ├── conversation.entity.ts
│       │   │   └── message.entity.ts
│       │   ├── value-objects/
│       │   │   └── message-role.vo.ts
│       │   ├── events/
│       │   │   ├── conversation-created.event.ts
│       │   │   └── message-sent.event.ts
│       │   └── ports/
│       │       ├── conversation.repository.port.ts
│       │       └── ai-agent.port.ts         # 🆕 PORT POUR IA
│       ├── application/
│       │   └── services/
│       │       └── chat.service.ts          # 🔄 Refactoré
│       ├── infrastructure/
│       │   ├── adapters/
│       │   │   ├── prisma-conversation.adapter.ts
│       │   │   └── langchain-agent.adapter.ts
│       │   └── mappers/
│       └── presentation/
```

### Corrections Appliquées

#### 1. Port EventPublisher

```typescript
// ✅ APRÈS: shared/domain/ports/event-publisher.port.ts
import { DomainEvent } from '../base';

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: readonly DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
```

```typescript
// ✅ APRÈS: shared/infrastructure/messaging/rabbitmq-event-publisher.adapter.ts
@Injectable()
export class RabbitMQEventPublisherAdapter implements EventPublisher {
  // Implémentation RabbitMQ
}
```

```typescript
// ✅ APRÈS: intervenant.service.ts
import { EventPublisher, EVENT_PUBLISHER } from '../../../../shared/domain/ports';

@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,  // ✅ Interface !
  ) {}
}
```

#### 2. Module Chat avec Domain

```typescript
// ✅ APRÈS: chat/domain/entities/conversation.entity.ts
export class Conversation extends Entity<string> {
  private _title: string | null;
  private _messages: Message[];

  static create(props: CreateConversationProps): Conversation { }

  addMessage(role: MessageRole, content: string): Message { }
}
```

```typescript
// ✅ APRÈS: chat/domain/ports/conversation.repository.port.ts
export interface ConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findAll(): Promise<Conversation[]>;
  delete(id: string): Promise<void>;
}
```

```typescript
// ✅ APRÈS: chat/domain/ports/ai-agent.port.ts
export interface AIAgent {
  invoke(message: string, history: ChatMessage[]): Promise<AIAgentResponse>;
}
```

```typescript
// ✅ APRÈS: chat.service.ts
@Injectable()
export class ChatService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,  // ✅ Interface
    @Inject(AI_AGENT)
    private readonly aiAgent: AIAgent,  // ✅ Interface
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,  // ✅ Interface
  ) {}
}
```

#### 3. Exceptions Domain

```typescript
// ✅ APRÈS: shared/domain/exceptions/entity-not-found.exception.ts
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string | number) {
    super(`${entityName} with id ${id} not found`);
    this.entityName = entityName;
    this.entityId = id;
  }
}
```

```typescript
// ✅ APRÈS: intervenant.service.ts
import { EntityNotFoundException } from '../../../../shared/domain/exceptions';

async findById(id: number): Promise<Intervenant> {
  const intervenant = await this.repository.findById(id);
  if (!intervenant) {
    throw new EntityNotFoundException('Intervenant', id);  // ✅ Exception Domain
  }
  return intervenant;
}
```

```typescript
// ✅ APRÈS: shared/presentation/filters/domain-exception.filter.ts
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof EntityNotFoundException) {
      return response.status(404).json({
        statusCode: 404,
        message: exception.message,
      });
    }
    // ... autres exceptions
  }
}
```

---

## Comparaison : Flux d'une Requête

### AVANT : Création d'un Intervenant

```
HTTP POST /intervenants
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ IntervenantController                                           │
│   └── Valide DTO avec class-validator                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ IntervenantService (Application)                                │
│   ├── Vérifie unicité email (via Repository interface) ✅      │
│   ├── Crée Intervenant.create() (Domain) ✅                    │
│   ├── Sauvegarde via Repository (interface) ✅                 │
│   ├── Publie via EventBusService (CONCRET) ❌                  │
│   └── Retourne IntervenantResponseDto                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────┐    ┌──────────────────────────────────────┐
│ PrismaRepository    │    │ EventBusService (RabbitMQ)           │
│ (via interface) ✅  │    │ (COUPLAGE DIRECT) ❌                 │
└─────────────────────┘    └──────────────────────────────────────┘
```

### APRÈS : Création d'un Intervenant

```
HTTP POST /intervenants
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ IntervenantController (Presentation)                            │
│   ├── Valide DTO avec class-validator                          │
│   └── Traduit exceptions Domain → HTTP (via Filter)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ IntervenantService (Application)                                │
│   ├── Vérifie unicité email (via Port) ✅                      │
│   ├── Crée Intervenant.create() (Domain) ✅                    │
│   ├── Sauvegarde via Repository Port ✅                        │
│   ├── Publie via EventPublisher Port ✅                        │
│   └── Retourne Intervenant (Entity Domain)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PORTS (Interfaces)                           │
│  IntervenantRepository          EventPublisher                  │
└────────────────────────┬───────────────┬────────────────────────┘
                         │               │
         ┌───────────────┘               └───────────────┐
         ▼                                               ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│ PrismaIntervenantAdapter│    │ RabbitMQEventPublisherAdapter    │
│ (Implémente Port) ✅    │    │ (Implémente Port) ✅             │
└─────────────────────────┘    └──────────────────────────────────┘
```

---

## Avantages de la Nouvelle Architecture

### 1. Testabilité

```typescript
// Test AVANT : Nécessite RabbitMQ réel ou mock complexe
describe('IntervenantService', () => {
  // Difficile à tester sans RabbitMQ
});

// Test APRÈS : Mock simple de l'interface
describe('IntervenantService', () => {
  const mockEventPublisher: EventPublisher = {
    publish: jest.fn(),
    publishAll: jest.fn(),
  };

  const service = new IntervenantService(mockRepo, mockEventPublisher);
  // Test facile !
});
```

### 2. Interchangeabilité

```typescript
// Changer RabbitMQ pour Kafka ? Juste créer un nouvel adapter :
@Injectable()
export class KafkaEventPublisherAdapter implements EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    // Implémentation Kafka
  }
}

// Et changer le binding dans le module :
{
  provide: EVENT_PUBLISHER,
  useClass: KafkaEventPublisherAdapter,  // Au lieu de RabbitMQ
}
```

### 3. Indépendance du Framework

```typescript
// La couche Application ne connaît plus NestJS
// Elle peut être utilisée avec :
// - NestJS (actuel)
// - Express
// - Fastify
// - CLI
// - Tests
```

### 4. Domain Protégé

```
Le Domain ne dépend de RIEN d'externe :
- Pas de NestJS
- Pas de Prisma
- Pas de RabbitMQ
- Pas de LangChain

Il contient UNIQUEMENT :
- Entités
- Value Objects
- Events
- Interfaces (Ports)
- Exceptions métier
```

---

## Tableau Récapitulatif

| Aspect | AVANT | APRÈS |
|--------|-------|-------|
| EventBus | Classe concrète injectée | Port + Adapter |
| Chat Domain | Inexistant | Entités, VO, Events, Ports |
| Chat persistence | Prisma direct | Repository Port + Adapter |
| Chat AI | LangChain direct | AIAgent Port + Adapter |
| Exceptions | NestJS (NotFoundException) | Domain (EntityNotFoundException) |
| Traduction exceptions | Dans le service | Filter dans Presentation |
| Structure ports | repositories/ | ports/ (explicite) |
| Structure adapters | persistence/ | adapters/ (explicite) |
| DTOs | application/dtos/ | presentation/dtos/ |
| Testabilité | Moyenne | Excellente |
| Couplage framework | Fort | Faible |

---

## Diagramme Final

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ IntervenantCtrl  │  │  MissionCtrl     │  │      ChatCtrl            │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │
│           │                     │                         │                 │
│  ┌────────┴─────────────────────┴─────────────────────────┴─────────────┐  │
│  │                    DomainExceptionFilter                              │  │
│  │              (Traduit exceptions Domain → HTTP)                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │IntervenantService│  │  MissionService  │  │      ChatService         │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │
│           │                     │                         │                 │
│           └─────────────────────┼─────────────────────────┘                 │
│                                 │                                           │
│                    Dépend uniquement des PORTS                              │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          DOMAIN (Hexagone)                                  │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│   │  Entities   │  │Value Objects│  │   Events    │  │   Exceptions    │   │
│   │ Intervenant │  │   Email     │  │  Created    │  │EntityNotFound   │   │
│   │  Mission    │  │   Duree     │  │  Updated    │  │BusinessViolation│   │
│   │Conversation │  │MessageRole  │  │  Deleted    │  │                 │   │
│   │  Message    │  │   Lieu      │  │   Sent      │  │                 │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                           PORTS                                      │   │
│   │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │   │
│   │  │IntervenantRepo    │ │ConversationRepo   │ │  EventPublisher   │  │   │
│   │  │MissionRepo        │ │    AIAgent        │ │                   │  │   │
│   │  └───────────────────┘ └───────────────────┘ └───────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     │ Implémente
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                            INFRASTRUCTURE                                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          ADAPTERS                                    │   │
│   │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │   │
│   │  │PrismaIntervenant  │ │PrismaConversation │ │RabbitMQPublisher  │  │   │
│   │  │PrismaMission      │ │LangChainAgent     │ │                   │  │   │
│   │  └───────────────────┘ └───────────────────┘ └───────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │
│   │  PrismaService  │  │    RabbitMQ     │  │      LangChain          │    │
│   │   (PostgreSQL)  │  │                 │  │       (OpenAI)          │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────────────┘    │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Fichiers Modifiés/Créés

### Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| `shared/domain/ports/event-publisher.port.ts` | Port pour publication d'événements |
| `shared/domain/exceptions/*.ts` | Exceptions métier |
| `shared/presentation/filters/domain-exception.filter.ts` | Traduction exceptions |
| `chat/domain/entities/conversation.entity.ts` | Entité Conversation |
| `chat/domain/entities/message.entity.ts` | Entité Message |
| `chat/domain/value-objects/message-role.vo.ts` | Value Object rôle |
| `chat/domain/ports/conversation.repository.port.ts` | Port repository |
| `chat/domain/ports/ai-agent.port.ts` | Port pour IA |
| `chat/infrastructure/adapters/*.ts` | Implémentations des ports |

### Fichiers Modifiés

| Fichier | Modification |
|---------|--------------|
| `intervenant.service.ts` | Utilise EventPublisher port |
| `mission.service.ts` | Utilise EventPublisher port |
| `chat.service.ts` | Utilise ports au lieu d'infra directe |
| `*.module.ts` | Nouveaux bindings ports → adapters |
| `event-bus.service.ts` | Renommé en adapter |

---

## Conclusion

Cette transformation apporte :

1. **Isolation totale du Domain** - Aucune dépendance externe
2. **Ports explicites** - Contrats clairs entre couches
3. **Adapters interchangeables** - Facile de changer d'implémentation
4. **Testabilité maximale** - Mocks simples via interfaces
5. **Indépendance framework** - La logique métier survit au framework

Le projet respecte maintenant les principes de l'**Architecture Hexagonale** tels que définis par Alistair Cockburn.
