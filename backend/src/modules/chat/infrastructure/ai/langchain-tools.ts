import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { IntervenantService } from '../../../intervenant/application/services/intervenant.service';
import { MissionService } from '../../../mission/application/services/mission.service';

/**
 * Crée les tools LangChain pour le chatbot
 *
 * Chaque tool est défini avec:
 * - name: Nom unique du tool
 * - description: Description pour le LLM (crucial pour le choix du tool)
 * - schema: Validation Zod des paramètres
 * - func: La fonction à exécuter
 */
export function createChatTools(
  intervenantService: IntervenantService,
  missionService: MissionService,
): DynamicStructuredTool[] {
  return [
    // =============================================
    // INTERVENANT TOOLS (6)
    // =============================================
    new DynamicStructuredTool({
      name: 'createIntervenant',
      description:
        "Créer un nouvel intervenant (enseignant/formateur). Utiliser quand l'utilisateur veut ajouter une nouvelle personne au système.",
      schema: z.object({
        nom: z.string().describe("Nom complet de l'intervenant"),
        email: z.string().email().describe('Adresse email unique'),
        telephone: z
          .string()
          .optional()
          .describe('Numéro de téléphone (optionnel)'),
        specialite: z
          .string()
          .describe("Domaine d'expertise (ex: NestJS, React, DevOps)"),
      }),
      func: async ({ nom, email, telephone, specialite }) => {
        try {
          const result = await intervenantService.create({
            nom,
            email,
            telephone,
            specialite,
          });
          return JSON.stringify({
            success: true,
            message: `Intervenant "${nom}" créé avec succès`,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getIntervenants',
      description:
        'Récupérer la liste de tous les intervenants. Utiliser pour voir tous les intervenants disponibles dans le système.',
      schema: z.object({}),
      func: async () => {
        try {
          const result = await intervenantService.findAll();
          return JSON.stringify({
            success: true,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'searchIntervenants',
      description:
        'Rechercher des intervenants par nom, email ou spécialité. Utiliser pour trouver des intervenants spécifiques.',
      schema: z.object({
        query: z
          .string()
          .describe('Terme de recherche (nom, email ou spécialité)'),
      }),
      func: async ({ query }) => {
        try {
          const result = await intervenantService.search(query);
          return JSON.stringify({
            success: true,
            query,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getIntervenantById',
      description:
        "Récupérer les détails d'un intervenant par son ID. Utiliser pour voir les informations complètes d'un intervenant.",
      schema: z.object({
        id: z.number().describe("ID de l'intervenant"),
      }),
      func: async ({ id }) => {
        try {
          const result = await intervenantService.findById(id);
          return JSON.stringify({ success: true, data: result });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'updateIntervenant',
      description:
        "Mettre à jour les informations d'un intervenant existant. Utiliser pour modifier nom, email, téléphone ou spécialité.",
      schema: z.object({
        id: z.number().describe("ID de l'intervenant à modifier"),
        nom: z.string().optional().describe('Nouveau nom'),
        email: z.string().email().optional().describe('Nouvel email'),
        telephone: z.string().optional().describe('Nouveau téléphone'),
        specialite: z.string().optional().describe('Nouvelle spécialité'),
      }),
      func: async ({ id, nom, email, telephone, specialite }) => {
        try {
          const result = await intervenantService.update(id, {
            nom,
            email,
            telephone,
            specialite,
          });
          return JSON.stringify({
            success: true,
            message: `Intervenant #${id} mis à jour`,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'deleteIntervenant',
      description:
        "Supprimer un intervenant du système. Utiliser quand l'utilisateur veut retirer définitivement un intervenant.",
      schema: z.object({
        id: z.number().describe("ID de l'intervenant à supprimer"),
      }),
      func: async ({ id }) => {
        try {
          await intervenantService.delete(id);
          return JSON.stringify({
            success: true,
            message: `Intervenant #${id} supprimé avec succès`,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    // =============================================
    // MISSION TOOLS (11)
    // =============================================
    new DynamicStructuredTool({
      name: 'createMission',
      description:
        "Créer une nouvelle mission d'enseignement. Utiliser pour planifier une nouvelle formation ou cours.",
      schema: z.object({
        titre: z.string().describe('Titre de la mission/formation'),
        date: z
          .string()
          .describe(
            'Date et heure de début (format ISO 8601, ex: 2024-03-15T09:00:00Z)',
          ),
        duree: z.number().min(15).max(480).describe('Durée en minutes (15-480)'),
        lieu: z.string().describe('Lieu de la mission'),
        intervenantId: z
          .number()
          .optional()
          .describe("ID de l'intervenant à assigner (optionnel)"),
      }),
      func: async ({ titre, date, duree, lieu, intervenantId }) => {
        try {
          const result = await missionService.create({
            titre,
            date: new Date(date),
            duree,
            lieu,
            intervenantId,
          });
          return JSON.stringify({
            success: true,
            message: `Mission "${titre}" créée avec succès`,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getMissions',
      description:
        "Récupérer la liste de toutes les missions. Utiliser pour voir l'ensemble des missions planifiées.",
      schema: z.object({}),
      func: async () => {
        try {
          const result = await missionService.findAll();
          return JSON.stringify({
            success: true,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'searchMissions',
      description:
        'Rechercher des missions par titre ou lieu. Utiliser pour trouver des missions spécifiques.',
      schema: z.object({
        query: z.string().describe('Terme de recherche (titre ou lieu)'),
      }),
      func: async ({ query }) => {
        try {
          const result = await missionService.search(query);
          return JSON.stringify({
            success: true,
            query,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getMissionById',
      description:
        "Récupérer les détails d'une mission par son ID. Utiliser pour voir les informations complètes d'une mission.",
      schema: z.object({
        id: z.number().describe('ID de la mission'),
      }),
      func: async ({ id }) => {
        try {
          const result = await missionService.findById(id);
          return JSON.stringify({ success: true, data: result });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getUpcomingMissions',
      description:
        'Récupérer les missions à venir (futures). Utiliser pour voir les prochaines missions planifiées.',
      schema: z.object({}),
      func: async () => {
        try {
          const result = await missionService.findUpcoming();
          return JSON.stringify({
            success: true,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getUnassignedMissions',
      description:
        "Récupérer les missions sans intervenant assigné. Utiliser pour voir les missions qui ont besoin d'un intervenant.",
      schema: z.object({}),
      func: async () => {
        try {
          const result = await missionService.findUnassigned();
          return JSON.stringify({
            success: true,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'getMissionsByIntervenant',
      description:
        "Récupérer les missions d'un intervenant spécifique. Utiliser pour voir le planning d'un intervenant.",
      schema: z.object({
        intervenantId: z.number().describe("ID de l'intervenant"),
      }),
      func: async ({ intervenantId }) => {
        try {
          const result = await missionService.findByIntervenant(intervenantId);
          return JSON.stringify({
            success: true,
            intervenantId,
            count: result.length,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'updateMission',
      description:
        "Mettre à jour les informations d'une mission existante. Utiliser pour modifier titre, date, durée ou lieu.",
      schema: z.object({
        id: z.number().describe('ID de la mission à modifier'),
        titre: z.string().optional().describe('Nouveau titre'),
        date: z.string().optional().describe('Nouvelle date ISO 8601'),
        duree: z.number().optional().describe('Nouvelle durée en minutes'),
        lieu: z.string().optional().describe('Nouveau lieu'),
      }),
      func: async ({ id, titre, date, duree, lieu }) => {
        try {
          const result = await missionService.update(id, {
            titre,
            date: date ? new Date(date) : undefined,
            duree,
            lieu,
          });
          return JSON.stringify({
            success: true,
            message: `Mission #${id} mise à jour`,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'assignMission',
      description:
        'Assigner un intervenant à une mission. Utiliser pour affecter un intervenant à une mission existante.',
      schema: z.object({
        missionId: z.number().describe('ID de la mission'),
        intervenantId: z.number().describe("ID de l'intervenant à assigner"),
      }),
      func: async ({ missionId, intervenantId }) => {
        try {
          const result = await missionService.assign(missionId, {
            intervenantId,
          });
          return JSON.stringify({
            success: true,
            message: `Intervenant #${intervenantId} assigné à la mission #${missionId}`,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'unassignMission',
      description:
        "Retirer l'intervenant d'une mission. Utiliser pour désassigner l'intervenant actuel d'une mission.",
      schema: z.object({
        missionId: z.number().describe('ID de la mission'),
      }),
      func: async ({ missionId }) => {
        try {
          const result = await missionService.unassign(missionId);
          return JSON.stringify({
            success: true,
            message: `Intervenant retiré de la mission #${missionId}`,
            data: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),

    new DynamicStructuredTool({
      name: 'deleteMission',
      description:
        "Supprimer une mission. Utiliser quand l'utilisateur veut annuler/retirer une mission du système.",
      schema: z.object({
        id: z.number().describe('ID de la mission à supprimer'),
      }),
      func: async ({ id }) => {
        try {
          await missionService.delete(id);
          return JSON.stringify({
            success: true,
            message: `Mission #${id} supprimée avec succès`,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
        }
      },
    }),
  ];
}
