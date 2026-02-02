import { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Définitions des 17 tools pour le chatbot
 * Ces tools permettent de gérer les intervenants et les missions
 * via des commandes en langage naturel
 */
export const TOOL_DEFINITIONS: ChatCompletionTool[] = [
  // =============================================
  // INTERVENANT TOOLS (6)
  // =============================================
  {
    type: 'function',
    function: {
      name: 'createIntervenant',
      description:
        "Créer un nouvel intervenant (enseignant/formateur). Utiliser quand l'utilisateur veut ajouter une nouvelle personne.",
      parameters: {
        type: 'object',
        properties: {
          nom: {
            type: 'string',
            description: "Nom complet de l'intervenant",
          },
          email: {
            type: 'string',
            description: 'Adresse email unique',
          },
          telephone: {
            type: 'string',
            description: 'Numéro de téléphone (optionnel)',
          },
          specialite: {
            type: 'string',
            description: "Domaine d'expertise (ex: NestJS, React, DevOps)",
          },
        },
        required: ['nom', 'email', 'specialite'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getIntervenants',
      description:
        "Récupérer la liste de tous les intervenants. Utiliser quand l'utilisateur veut voir tous les intervenants disponibles.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchIntervenants',
      description:
        'Rechercher des intervenants par nom, email ou spécialité. Utiliser pour trouver des intervenants spécifiques.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Terme de recherche (nom, email ou spécialité)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getIntervenantById',
      description:
        "Récupérer les détails d'un intervenant par son ID. Utiliser pour voir les informations d'un intervenant spécifique.",
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: "ID de l'intervenant",
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateIntervenant',
      description:
        "Mettre à jour les informations d'un intervenant existant. Utiliser pour modifier nom, email, téléphone ou spécialité.",
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: "ID de l'intervenant à modifier",
          },
          nom: {
            type: 'string',
            description: 'Nouveau nom (optionnel)',
          },
          email: {
            type: 'string',
            description: 'Nouvel email (optionnel)',
          },
          telephone: {
            type: 'string',
            description: 'Nouveau téléphone (optionnel)',
          },
          specialite: {
            type: 'string',
            description: 'Nouvelle spécialité (optionnel)',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteIntervenant',
      description:
        "Supprimer un intervenant. Utiliser quand l'utilisateur veut retirer un intervenant du système.",
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: "ID de l'intervenant à supprimer",
          },
        },
        required: ['id'],
      },
    },
  },

  // =============================================
  // MISSION TOOLS (11)
  // =============================================
  {
    type: 'function',
    function: {
      name: 'createMission',
      description:
        "Créer une nouvelle mission d'enseignement. Utiliser pour planifier une nouvelle formation ou cours.",
      parameters: {
        type: 'object',
        properties: {
          titre: {
            type: 'string',
            description: 'Titre de la mission/formation',
          },
          date: {
            type: 'string',
            description:
              'Date et heure de début (format ISO 8601, ex: 2024-03-15T09:00:00Z)',
          },
          duree: {
            type: 'number',
            description: 'Durée en minutes (entre 15 et 480)',
          },
          lieu: {
            type: 'string',
            description: 'Lieu de la mission',
          },
          intervenantId: {
            type: 'number',
            description: "ID de l'intervenant à assigner (optionnel)",
          },
        },
        required: ['titre', 'date', 'duree', 'lieu'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMissions',
      description:
        "Récupérer la liste de toutes les missions. Utiliser pour voir l'ensemble des missions planifiées.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchMissions',
      description:
        'Rechercher des missions par titre ou lieu. Utiliser pour trouver des missions spécifiques.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Terme de recherche (titre ou lieu)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMissionById',
      description:
        "Récupérer les détails d'une mission par son ID. Utiliser pour voir les informations d'une mission spécifique.",
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'ID de la mission',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getUpcomingMissions',
      description:
        'Récupérer les missions à venir (futures). Utiliser pour voir les prochaines missions planifiées.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getUnassignedMissions',
      description:
        "Récupérer les missions sans intervenant assigné. Utiliser pour voir les missions qui ont besoin d'un intervenant.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMissionsByIntervenant',
      description:
        "Récupérer les missions assignées à un intervenant spécifique. Utiliser pour voir le planning d'un intervenant.",
      parameters: {
        type: 'object',
        properties: {
          intervenantId: {
            type: 'number',
            description: "ID de l'intervenant",
          },
        },
        required: ['intervenantId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateMission',
      description:
        "Mettre à jour les informations d'une mission existante. Utiliser pour modifier titre, date, durée ou lieu.",
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'ID de la mission à modifier',
          },
          titre: {
            type: 'string',
            description: 'Nouveau titre (optionnel)',
          },
          date: {
            type: 'string',
            description: 'Nouvelle date ISO 8601 (optionnel)',
          },
          duree: {
            type: 'number',
            description: 'Nouvelle durée en minutes (optionnel)',
          },
          lieu: {
            type: 'string',
            description: 'Nouveau lieu (optionnel)',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assignMission',
      description:
        "Assigner un intervenant à une mission. Utiliser pour affecter un intervenant à une mission existante.",
      parameters: {
        type: 'object',
        properties: {
          missionId: {
            type: 'number',
            description: 'ID de la mission',
          },
          intervenantId: {
            type: 'number',
            description: "ID de l'intervenant à assigner",
          },
        },
        required: ['missionId', 'intervenantId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unassignMission',
      description:
        "Retirer l'intervenant d'une mission. Utiliser pour désassigner l'intervenant actuel d'une mission.",
      parameters: {
        type: 'object',
        properties: {
          missionId: {
            type: 'number',
            description: 'ID de la mission',
          },
        },
        required: ['missionId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteMission',
      description:
        "Supprimer une mission. Utiliser quand l'utilisateur veut annuler/retirer une mission.",
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'ID de la mission à supprimer',
          },
        },
        required: ['id'],
      },
    },
  },
];
