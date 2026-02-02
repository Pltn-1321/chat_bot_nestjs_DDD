# Gestion Intervenants & Missions - Chatbot

Application de gestion des intervenants et missions avec un chatbot IA utilisant LangChain et OpenRouter.

## Stack Technique

### Backend
- **NestJS** - Framework Node.js avec architecture DDD
- **Prisma** - ORM avec PostgreSQL
- **LangChain** - Framework IA avec tool calling
- **OpenRouter** - API LLM (modèle `z-ai/glm-4.5-air:free`)
- **RabbitMQ** - Event bus pour les Domain Events

### Frontend
- **React 19** + TypeScript
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Composants UI
- **Zustand** - State management
- **React Query v5** - Data fetching

## Installation

### Prérequis
- Node.js v20+
- PostgreSQL
- RabbitMQ
- Compte OpenRouter (clé API)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL, OPENROUTER_API_KEY, RABBITMQ_URL
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cours_nestjs?schema=public"

# OpenRouter AI
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="z-ai/glm-4.5-air:free"

# RabbitMQ
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# Application
PORT=3000
NODE_ENV=development
```

## Architecture

```
backend/src/
├── modules/
│   ├── intervenant/     # Bounded Context Intervenant (DDD)
│   ├── mission/         # Bounded Context Mission (DDD)
│   └── chat/            # Module Chatbot
│       ├── infrastructure/ai/
│       │   ├── langchain-tools.ts      # 17 DynamicStructuredTools
│       │   └── langchain-agent.service.ts
│       ├── application/services/
│       │   └── chat.service.ts
│       └── presentation/
│           └── chat.controller.ts
└── shared/
    ├── infrastructure/prisma/
    └── infrastructure/messaging/

frontend/src/
├── components/chat/     # Widget chat flottant
├── stores/              # Zustand store
├── hooks/               # useChat hook
└── lib/api/             # API client
```

## Chatbot - Tools Disponibles (17)

### Intervenants (6)
| Tool | Description |
|------|-------------|
| `createIntervenant` | Créer un intervenant (nom, email, spécialité, téléphone?) |
| `getIntervenants` | Lister tous les intervenants |
| `searchIntervenants` | Rechercher par nom, email ou spécialité |
| `getIntervenantById` | Récupérer un intervenant par ID |
| `updateIntervenant` | Modifier un intervenant |
| `deleteIntervenant` | Supprimer un intervenant |

### Missions (11)
| Tool | Description |
|------|-------------|
| `createMission` | Créer une mission (titre, date, durée, lieu) |
| `getMissions` | Lister toutes les missions |
| `searchMissions` | Rechercher par titre ou lieu |
| `getMissionById` | Récupérer une mission par ID |
| `getUpcomingMissions` | Missions à venir |
| `getUnassignedMissions` | Missions sans intervenant |
| `getMissionsByIntervenant` | Missions d'un intervenant |
| `updateMission` | Modifier une mission |
| `assignMission` | Assigner un intervenant à une mission |
| `unassignMission` | Retirer l'intervenant d'une mission |
| `deleteMission` | Supprimer une mission |

## Exemples d'utilisation

```
"Liste les intervenants"
→ Appelle getIntervenants

"Crée un intervenant Marie Martin, email marie@test.com, spécialité React"
→ Appelle createIntervenant

"Quelles missions n'ont pas d'intervenant ?"
→ Appelle getUnassignedMissions

"Assigne l'intervenant 1 à la mission 2"
→ Appelle assignMission
```

## API Endpoints

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/message` | Envoyer un message au chatbot |
| GET | `/chat/conversations` | Lister les conversations |
| GET | `/chat/conversations/:id` | Récupérer une conversation |
| DELETE | `/chat/conversations/:id` | Supprimer une conversation |

### Intervenants
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/intervenants` | Créer |
| GET | `/intervenants` | Lister |
| GET | `/intervenants/search` | Rechercher |
| GET | `/intervenants/:id` | Récupérer |
| PUT | `/intervenants/:id` | Modifier |
| DELETE | `/intervenants/:id` | Supprimer |

### Missions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/missions` | Créer |
| GET | `/missions` | Lister |
| GET | `/missions/upcoming` | À venir |
| GET | `/missions/unassigned` | Non assignées |
| GET | `/missions/search` | Rechercher |
| GET | `/missions/:id` | Récupérer |
| PUT | `/missions/:id` | Modifier |
| POST | `/missions/:id/assign` | Assigner |
| POST | `/missions/:id/unassign` | Désassigner |
| DELETE | `/missions/:id` | Supprimer |

## Swagger

Documentation API disponible sur : http://localhost:3000/api

## Licence

MIT
