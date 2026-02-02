# Phase 2 : Couche Domain - Le Cœur du DDD

## Vue d'ensemble

La **couche Domain** est le cœur de votre application. Elle contient toute la **logique métier** et ne dépend d'**aucune technologie externe** (pas de Prisma, pas de NestJS, pas de base de données).

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    INFRASTRUCTURE                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                    DOMAIN                            │  │  │
│  │  │                                                      │  │  │
│  │  │    ╔═══════════════════════════════════════════╗    │  │  │
│  │  │    ║  Entities    Value Objects    Events      ║    │  │  │
│  │  │    ║                                           ║    │  │  │
│  │  │    ║         LOGIQUE MÉTIER PURE               ║    │  │  │
│  │  │    ║                                           ║    │  │  │
│  │  │    ║  Repository Interfaces (Ports)            ║    │  │  │
│  │  │    ╚═══════════════════════════════════════════╝    │  │  │
│  │  │                                                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          ▲                                 │  │
│  │                          │ implémente                      │  │
│  │                          │                                 │  │
│  │    Prisma Repository ────┘     Controllers                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│      Frontend        API Externe        Message Queue            │
└─────────────────────────────────────────────────────────────────┘
```

**Principe clé** : Les dépendances pointent vers l'intérieur. Le Domain ne connaît RIEN de l'extérieur.

---

## Structure des fichiers

```
backend/src/modules/
├── intervenant/domain/
│   ├── entities/
│   │   └── intervenant.entity.ts      # Aggregate Root
│   ├── value-objects/
│   │   ├── email.vo.ts                # Validation + normalisation email
│   │   └── specialite.vo.ts           # Validation + capitalisation
│   ├── events/
│   │   ├── intervenant-created.event.ts
│   │   ├── intervenant-updated.event.ts
│   │   └── intervenant-deleted.event.ts
│   ├── repositories/
│   │   └── intervenant.repository.interface.ts  # PORT
│   └── index.ts
│
└── mission/domain/
    ├── entities/
    │   └── mission.entity.ts          # Aggregate Root
    ├── value-objects/
    │   ├── lieu.vo.ts                 # Validation lieu (>= 2 chars)
    │   └── duree.vo.ts                # Validation durée (15-480 min)
    ├── events/
    │   ├── mission-created.event.ts
    │   ├── mission-updated.event.ts
    │   ├── mission-deleted.event.ts
    │   ├── mission-assigned.event.ts    # ⚡ Cross-module
    │   └── mission-unassigned.event.ts  # ⚡ Cross-module
    ├── repositories/
    │   └── mission.repository.interface.ts  # PORT
    └── index.ts
```

### Relations entre les deux Aggregates

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────────────────┐         ┌─────────────────────┐      │
│   │     INTERVENANT     │         │       MISSION       │      │
│   │     (Aggregate)     │         │     (Aggregate)     │      │
│   │                     │         │                     │      │
│   │  • id: number       │◄────────│  • intervenantId    │      │
│   │  • nom              │   ref   │  • titre            │      │
│   │  • email (VO)       │   par   │  • date             │      │
│   │  • specialite (VO)  │   ID    │  • duree (VO)       │      │
│   │                     │         │  • lieu (VO)        │      │
│   └─────────────────────┘         └─────────────────────┘      │
│                                                                  │
│   RÈGLE DDD : On ne stocke PAS l'entité Intervenant dans       │
│   Mission, seulement son ID. Les Aggregates sont indépendants.  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Entity vs Value Object

### Qu'est-ce qui les différencie ?

| Critère | Entity | Value Object |
|---------|--------|--------------|
| **Identité** | A une identité unique (ID) | Défini par ses attributs |
| **Mutabilité** | Peut changer d'état | Immutable |
| **Comparaison** | Par ID | Par valeurs |
| **Cycle de vie** | Persisté, suivi | Jetable, recréable |

### Analogie du monde réel

```
🧑 ENTITY : Une Personne
├── ID unique (numéro de sécu)
├── Peut changer (nom, adresse, âge)
└── Même personne même si tout change

📧 VALUE OBJECT : Une Adresse Email
├── Pas d'ID propre
├── "jean@mail.com" = "jean@mail.com"
└── Si l'email change, c'est un NOUVEL email
```

---

## 2. Les Value Objects en détail

### Pourquoi utiliser des Value Objects ?

```typescript
// ❌ MAUVAIS : String brut
class Intervenant {
  email: string;  // Aucune validation, peut être "nimporte quoi"
}

// ✅ BON : Value Object
class Intervenant {
  email: Email;   // Toujours valide, normalisé, typé
}
```

### Anatomie d'un Value Object

```
┌─────────────────────────────────────────────────────┐
│                    VALUE OBJECT                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ Constructeur PRIVÉ                          │    │
│  │ → Force l'utilisation de la factory         │    │
│  └─────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ Factory Method: create()                    │    │
│  │ 1. Validation des règles métier             │    │
│  │ 2. Normalisation des données                │    │
│  │ 3. Création de l'instance                   │    │
│  └─────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ Props IMMUTABLES (Object.freeze)            │    │
│  │ → Impossible de modifier après création     │    │
│  └─────────────────────────────────────────────┘    │
│                       │                              │
│                       ▼                              │
│  ┌─────────────────────────────────────────────┐    │
│  │ Méthode equals()                            │    │
│  │ → Compare par valeur, pas par référence     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Code : Email Value Object

```typescript
// backend/src/modules/intervenant/domain/value-objects/email.vo.ts

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  // Regex pour valider le format email
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 1️⃣ Constructeur PRIVÉ
  private constructor(props: EmailProps) {
    super(props);  // Object.freeze(props) dans la classe parent
  }

  // 2️⃣ Factory Method - seul point d'entrée
  static create(email: string): Email {
    // Validation 1: non vide
    if (!email || email.trim().length === 0) {
      throw new Error("L'email ne peut pas être vide");
    }

    // Normalisation: minuscules, trim
    const normalizedEmail = email.trim().toLowerCase();

    // Validation 2: format
    if (!this.EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error(`Format d'email invalide: ${email}`);
    }

    return new Email({ value: normalizedEmail });
  }

  // 3️⃣ Getter pour accéder à la valeur
  get value(): string {
    return this.props.value;
  }
}
```

### Utilisation

```typescript
// ✅ Création valide
const email1 = Email.create("Jean.Dupont@Email.COM");
console.log(email1.value);  // "jean.dupont@email.com" (normalisé)

// ✅ Comparaison par valeur
const email2 = Email.create("jean.dupont@email.com");
console.log(email1.equals(email2));  // true (même valeur)

// ❌ Erreur : format invalide
const bad = Email.create("pas-un-email");  // throw Error!

// ❌ Impossible de modifier
email1.props.value = "autre@mail.com";  // TypeError: frozen
```

---

## 3. L'Entity en détail

### Anatomie d'une Entity

```
┌──────────────────────────────────────────────────────────────┐
│                         ENTITY                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ ID unique (hérite de Entity<TId>)                   │     │
│  │ → Définit l'identité de l'entité                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Propriétés PRIVÉES                                  │     │
│  │ _nom, _email, _telephone, _specialite               │     │
│  │ → Encapsulation : accès contrôlé via getters        │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Factory Methods                                     │     │
│  │ • create() → Nouvel intervenant (ID=0)             │     │
│  │ • reconstruct() → Depuis la BDD (avec ID)          │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Méthodes MÉTIER                                     │     │
│  │ • update() → Modifie + émet événement              │     │
│  │ • markAsDeleted() → Émet événement suppression     │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Domain Events (liste interne)                       │     │
│  │ → Enregistre ce qui s'est passé                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Pourquoi deux Factory Methods ?

```
                    ┌─────────────────┐
                    │   Intervenant   │
                    └────────┬────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
           ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│     create()        │           │   reconstruct()     │
├─────────────────────┤           ├─────────────────────┤
│ • Nouvel objet      │           │ • Depuis la BDD     │
│ • ID = 0 (temporaire)│          │ • ID existant       │
│ • Valide tout       │           │ • Données déjà      │
│ • Émet événement    │           │   validées          │
│   "Created"         │           │ • PAS d'événement   │
└─────────────────────┘           └─────────────────────┘
         │                                   │
         ▼                                   ▼
   Action MÉTIER                      Action TECHNIQUE
   (nouveau client)               (charger depuis DB)
```

### Code : Intervenant Entity (extraits clés)

```typescript
export class Intervenant extends Entity<number> {
  // Propriétés privées avec Value Objects
  private _nom: string;
  private _email: Email;           // Value Object
  private _telephone: string | null;
  private _specialite: Specialite;  // Value Object

  // Constructeur PRIVÉ
  private constructor(
    id: number,
    nom: string,
    email: Email,
    telephone: string | null,
    specialite: Specialite,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);  // Appelle Entity<number>
    this._nom = nom;
    this._email = email;
    // ...
  }

  // Factory 1: Création (action métier)
  static create(props: CreateIntervenantProps): Intervenant {
    // 1. Validation du nom
    if (!props.nom || props.nom.trim().length < 2) {
      throw new Error('Le nom doit avoir au moins 2 caractères');
    }

    // 2. Création des Value Objects (ils valident eux-mêmes)
    const email = Email.create(props.email);
    const specialite = Specialite.create(props.specialite);

    // 3. Création de l'entité
    const intervenant = new Intervenant(
      0,  // ID temporaire → assigné par la BDD
      props.nom.trim(),
      email,
      props.telephone?.trim() || null,
      specialite,
      new Date(),
      new Date(),
    );

    // 4. Émettre l'événement métier
    intervenant.addDomainEvent(
      new IntervenantCreatedEvent(/* ... */)
    );

    return intervenant;
  }

  // Factory 2: Reconstruction (technique)
  static reconstruct(props: ReconstructIntervenantProps): Intervenant {
    return new Intervenant(
      props.id,  // ID de la BDD
      props.nom,
      Email.create(props.email),
      props.telephone,
      Specialite.create(props.specialite),
      props.createdAt,
      props.updatedAt,
    );
    // Pas d'événement ici !
  }

  // Méthode métier : mise à jour
  update(props: { nom?: string; email?: string; /* ... */ }): void {
    const changedFields: string[] = [];

    if (props.nom !== undefined && props.nom !== this._nom) {
      // Validation
      if (props.nom.trim().length < 2) {
        throw new Error('Le nom doit avoir au moins 2 caractères');
      }
      this._nom = props.nom.trim();
      changedFields.push('nom');
    }

    // ... autres champs

    // Si quelque chose a changé → événement
    if (changedFields.length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(
        new IntervenantUpdatedEvent(this.id, changedFields)
      );
    }
  }
}
```

---

## 4. Le module Mission

### Value Objects spécifiques

Le module Mission a ses propres Value Objects avec des règles métier différentes :

```typescript
// Duree - Durée en minutes avec contraintes
export class Duree extends ValueObject<DureeProps> {
  private static readonly MIN_MINUTES = 15;   // Minimum 15 min
  private static readonly MAX_MINUTES = 480;  // Maximum 8h

  static create(minutes: number): Duree {
    if (minutes < this.MIN_MINUTES) {
      throw new Error(`Durée minimum: ${this.MIN_MINUTES} minutes`);
    }
    if (minutes > this.MAX_MINUTES) {
      throw new Error(`Durée maximum: ${this.MAX_MINUTES} minutes`);
    }
    return new Duree({ value: minutes });
  }

  // Méthodes utilitaires
  toHours(): number { return this.props.value / 60; }
  toString(): string { /* "2h30" ou "45min" */ }
}
```

### Entity Mission avec méthodes métier

```typescript
export class Mission extends Entity<number> {
  private _intervenantId: number | null;  // Référence par ID uniquement

  // Méthodes métier spécifiques
  assignIntervenant(intervenantId: number): void {
    if (this._intervenantId !== null) {
      throw new Error('Mission déjà assignée');
    }
    this._intervenantId = intervenantId;
    this.addDomainEvent(
      new MissionAssignedEvent(this.id, this._titre, intervenantId, this._date)
    );
  }

  unassignIntervenant(): void {
    if (this._intervenantId === null) {
      throw new Error('Aucun intervenant assigné');
    }
    const previousId = this._intervenantId;
    this._intervenantId = null;
    this.addDomainEvent(
      new MissionUnassignedEvent(this.id, previousId)
    );
  }

  // Getter utile
  get isAssigned(): boolean {
    return this._intervenantId !== null;
  }
}
```

### Repository Mission avec requêtes métier

```typescript
export interface MissionRepository {
  // CRUD standard
  save(mission: Mission): Promise<Mission>;
  findById(id: number): Promise<Mission | null>;
  findAll(): Promise<Mission[]>;
  delete(id: number): Promise<void>;

  // Requêtes métier spécifiques
  findByIntervenantId(intervenantId: number): Promise<Mission[]>;
  findUnassigned(): Promise<Mission[]>;
  findUpcoming(): Promise<Mission[]>;
  findByDateRange(start: Date, end: Date): Promise<Mission[]>;

  // Vérification de conflit de planning
  hasConflict(intervenantId: number, date: Date, excludeId?: number): Promise<boolean>;
}
```

---

## 5. Les Domain Events

### Qu'est-ce qu'un Domain Event ?

Un Domain Event capture **quelque chose d'important qui s'est passé** dans le domaine métier.

```
┌────────────────────────────────────────────────────────────┐
│                     DOMAIN EVENT                            │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  "Un intervenant a été créé"                               │
│  "Une mission a été assignée"                              │
│  "Un intervenant a changé d'email"                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • eventId : string       (identifiant unique)       │   │
│  │ • occurredAt : Date      (quand ?)                  │   │
│  │ • eventName : string     (nom de la classe)         │   │
│  │ • payload : données      (détails spécifiques)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Liste complète des événements

| Module | Événement | Déclenché par |
|--------|-----------|---------------|
| Intervenant | `IntervenantCreatedEvent` | `Intervenant.create()` |
| Intervenant | `IntervenantUpdatedEvent` | `intervenant.update()` |
| Intervenant | `IntervenantDeletedEvent` | `intervenant.markAsDeleted()` |
| Mission | `MissionCreatedEvent` | `Mission.create()` |
| Mission | `MissionUpdatedEvent` | `mission.update()` |
| Mission | `MissionDeletedEvent` | `mission.markAsDeleted()` |
| Mission | `MissionAssignedEvent` | `mission.assignIntervenant()` ⚡ |
| Mission | `MissionUnassignedEvent` | `mission.unassignIntervenant()` ⚡ |

### Événements Cross-Module (⚡)

Les événements `MissionAssignedEvent` et `MissionUnassignedEvent` sont **cross-module** :
- Émis par le module **Mission**
- Peuvent être écoutés par le module **Intervenant** (ou tout autre module)

```
┌─────────────────┐                    ┌─────────────────┐
│     Mission     │                    │   Intervenant   │
│     Module      │                    │     Module      │
│                 │  MissionAssigned   │                 │
│  mission.assign │ ─────────────────► │  • Notifier     │
│  Intervenant()  │     (Event Bus)    │  • Stats        │
│                 │                    │  • Planning     │
└─────────────────┘                    └─────────────────┘
         │
         │ (via RabbitMQ - Phase 5)
         ▼
┌─────────────────┐
│  Email Service  │
│  (notification) │
└─────────────────┘
```

### Pourquoi utiliser des Domain Events ?

```
┌──────────────────┐     Event      ┌──────────────────┐
│   Intervenant    │ ─────────────► │   Email Service  │
│   (créé)         │                │   (envoie email) │
└──────────────────┘                └──────────────────┘
         │
         │ Event
         ▼
┌──────────────────┐                ┌──────────────────┐
│   Audit Log      │                │   Analytics      │
│   (historique)   │                │   (statistiques) │
└──────────────────┘                └──────────────────┘

         DÉCOUPLAGE : L'Intervenant ne connaît pas
         les systèmes qui réagissent à sa création
```

### Code : IntervenantCreatedEvent

```typescript
// backend/src/modules/intervenant/domain/events/intervenant-created.event.ts

export class IntervenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly intervenantId: number,
    public readonly nom: string,
    public readonly email: string,
    public readonly specialite: string,
  ) {
    super();  // Définit occurredAt = new Date()
  }

  // Nom de l'événement pour le routage
  get eventName(): string {
    return 'intervenant.created';
  }
}
```

### Flux des événements

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  1. Intervenant.create()                                    │
│         │                                                    │
│         ▼                                                    │
│  2. addDomainEvent(new IntervenantCreatedEvent(...))        │
│         │                                                    │
│         ▼                                                    │
│  3. intervenant.domainEvents → [IntervenantCreatedEvent]    │
│         │                                                    │
│         │ (stocké dans l'entité)                            │
│         ▼                                                    │
│  4. Repository.save(intervenant)                            │
│         │                                                    │
│         ▼                                                    │
│  5. EventBus.publishAll(intervenant.domainEvents)           │
│         │                                                    │
│         ▼                                                    │
│  6. intervenant.clearDomainEvents()                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Le Repository Interface (PORT)

### Pattern Ports & Adapters

```
┌─────────────────────────────────────────────────────────────┐
│                         DOMAIN                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │   IntervenantRepository (INTERFACE = PORT)           │   │
│  │                                                       │   │
│  │   save(intervenant): Promise<Intervenant>            │   │
│  │   findById(id): Promise<Intervenant | null>          │   │
│  │   findByEmail(email): Promise<Intervenant | null>    │   │
│  │   findAll(): Promise<Intervenant[]>                  │   │
│  │   delete(id): Promise<void>                          │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▲                                  │
│                           │                                  │
│                           │ Le Domain définit               │
│                           │ le CONTRAT                      │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ implémente
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                           │                                  │
│                    INFRASTRUCTURE                            │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │                                                       │   │
│  │   PrismaIntervenantRepository (ADAPTER)              │   │
│  │                                                       │   │
│  │   Utilise Prisma pour implémenter le contrat         │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Avantages du pattern

| Avantage | Explication |
|----------|-------------|
| **Découplage** | Le Domain ne connaît pas Prisma |
| **Testabilité** | Facile de créer un MockRepository |
| **Flexibilité** | Changer d'ORM sans toucher au Domain |
| **Clarté** | Le contrat est explicite |

### Code : Interface Repository

```typescript
// backend/src/modules/intervenant/domain/repositories/intervenant.repository.interface.ts

import { Intervenant } from '../entities';
import { Email } from '../value-objects';

// Le PORT - définit le CONTRAT
export interface IntervenantRepository {
  save(intervenant: Intervenant): Promise<Intervenant>;
  findById(id: number): Promise<Intervenant | null>;
  findByEmail(email: Email): Promise<Intervenant | null>;
  findAll(): Promise<Intervenant[]>;
  search(query: string): Promise<Intervenant[]>;
  delete(id: number): Promise<void>;
  emailExists(email: Email, excludeId?: number): Promise<boolean>;
}

// Token pour l'injection de dépendances NestJS
export const INTERVENANT_REPOSITORY = Symbol('INTERVENANT_REPOSITORY');
```

### Utilisation avec NestJS (aperçu Phase 3)

```typescript
// Dans un service (Phase 4)
@Injectable()
export class IntervenantService {
  constructor(
    @Inject(INTERVENANT_REPOSITORY)
    private readonly repository: IntervenantRepository,
    // ↑ NestJS injecte PrismaIntervenantRepository
  ) {}

  async createIntervenant(dto: CreateIntervenantDto) {
    const intervenant = Intervenant.create({
      nom: dto.nom,
      email: dto.email,
      specialite: dto.specialite,
    });

    return this.repository.save(intervenant);
  }
}
```

---

## 7. Résumé : Flux complet

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUX DE CRÉATION                         │
└─────────────────────────────────────────────────────────────────┘

  DTO (données brutes)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Intervenant.create(props)                                       │
│                                                                  │
│  1. Valide le nom (>= 2 caractères)                             │
│  2. Crée Email Value Object (valide + normalise)                │
│  3. Crée Specialite Value Object (valide + capitalise)          │
│  4. Crée l'instance Intervenant (ID=0)                          │
│  5. Émet IntervenantCreatedEvent                                │
│                                                                  │
│  return intervenant (avec events stockés)                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Repository.save(intervenant)                                    │
│                                                                  │
│  1. Mapper transforme Domain → Prisma                           │
│  2. Prisma persiste en BDD                                      │
│  3. Récupère l'ID généré                                        │
│  4. Mapper transforme Prisma → Domain                           │
│  5. Publie les Domain Events                                    │
│  6. Clear les events de l'entité                                │
│                                                                  │
│  return intervenant (avec vrai ID)                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
  Intervenant avec ID persisté
```

---

## 8. Points clés à retenir

### ✅ Ce que fait la couche Domain

- Définit les **règles métier**
- Valide les **invariants** (email valide, nom >= 2 chars)
- Émet des **événements** pour les actions importantes
- Définit les **contrats** (interfaces Repository)

### ❌ Ce que la couche Domain ne fait PAS

- Pas d'accès à la base de données
- Pas de connaissance de NestJS
- Pas de HTTP, pas de REST
- Pas de dépendances externes

### 🎯 Avantages

1. **Testabilité** : Tout est testable sans infrastructure
2. **Maintenabilité** : Logique métier centralisée
3. **Évolutivité** : Changez la BDD sans toucher au métier
4. **Documentation** : Le code EST la spec métier

---

## Prochaine étape : Phase 3

Dans la Phase 3 (Infrastructure), nous allons implémenter les **ADAPTERS** pour les deux modules :

### Pour Intervenant
1. `PrismaIntervenantRepository` (l'ADAPTER)
2. `IntervenantMapper` (Domain ↔ Prisma)

### Pour Mission
1. `PrismaMissionRepository` (l'ADAPTER)
2. `MissionMapper` (Domain ↔ Prisma)

### Configuration NestJS
3. Connecter les Repositories avec l'injection de dépendances

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  DOMAIN (Phase 2)              INFRASTRUCTURE (Phase 3)         │
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │IntervenantRepository│◄─────│PrismaIntervenantRepository  │  │
│  │   (interface/PORT)  │      │       (ADAPTER)             │  │
│  └─────────────────────┘      │                             │  │
│                                │  + IntervenantMapper        │  │
│  ┌─────────────────────┐      │                             │  │
│  │  MissionRepository  │◄─────│PrismaMissionRepository      │  │
│  │   (interface/PORT)  │      │       (ADAPTER)             │  │
│  └─────────────────────┘      │                             │  │
│                                │  + MissionMapper            │  │
│                                └─────────────────────────────┘  │
│                                              │                   │
│                                              ▼                   │
│                                     ┌───────────────┐           │
│                                     │    Prisma     │           │
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
