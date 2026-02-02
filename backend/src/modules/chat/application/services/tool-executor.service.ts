import { Injectable, Logger } from '@nestjs/common';
import { IntervenantService } from '../../../intervenant/application/services/intervenant.service';
import { MissionService } from '../../../mission/application/services/mission.service';

/**
 * Résultat d'exécution d'un tool
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Service d'exécution des tools
 *
 * Ce service fait le lien entre les tools appelés par l'IA
 * et les services métier existants (IntervenantService, MissionService).
 *
 * Il encapsule les erreurs pour fournir des réponses cohérentes au LLM.
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly intervenantService: IntervenantService,
    private readonly missionService: MissionService,
  ) {}

  /**
   * Exécute un tool et retourne le résultat
   */
  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    this.logger.debug(`Exécution du tool: ${toolName}`, args);

    try {
      const result = await this.dispatchTool(toolName, args);
      this.logger.debug(`Tool ${toolName} exécuté avec succès`);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      this.logger.warn(`Erreur lors de l'exécution de ${toolName}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Dispatch le tool vers le service approprié
   */
  private async dispatchTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    switch (name) {
      // =============================================
      // INTERVENANT TOOLS
      // =============================================
      case 'createIntervenant':
        return this.intervenantService.create({
          nom: args.nom as string,
          email: args.email as string,
          telephone: args.telephone as string | undefined,
          specialite: args.specialite as string,
        });

      case 'getIntervenants':
        return this.intervenantService.findAll();

      case 'searchIntervenants':
        return this.intervenantService.search(args.query as string);

      case 'getIntervenantById':
        return this.intervenantService.findById(args.id as number);

      case 'updateIntervenant': {
        const updateData: Record<string, unknown> = {};
        if (args.nom !== undefined) updateData.nom = args.nom;
        if (args.email !== undefined) updateData.email = args.email;
        if (args.telephone !== undefined) updateData.telephone = args.telephone;
        if (args.specialite !== undefined)
          updateData.specialite = args.specialite;

        return this.intervenantService.update(
          args.id as number,
          updateData as {
            nom?: string;
            email?: string;
            telephone?: string;
            specialite?: string;
          },
        );
      }

      case 'deleteIntervenant':
        await this.intervenantService.delete(args.id as number);
        return { message: `Intervenant #${args.id} supprimé avec succès` };

      // =============================================
      // MISSION TOOLS
      // =============================================
      case 'createMission':
        return this.missionService.create({
          titre: args.titre as string,
          date: new Date(args.date as string),
          duree: args.duree as number,
          lieu: args.lieu as string,
          intervenantId: args.intervenantId as number | undefined,
        });

      case 'getMissions':
        return this.missionService.findAll();

      case 'searchMissions':
        return this.missionService.search(args.query as string);

      case 'getMissionById':
        return this.missionService.findById(args.id as number);

      case 'getUpcomingMissions':
        return this.missionService.findUpcoming();

      case 'getUnassignedMissions':
        return this.missionService.findUnassigned();

      case 'getMissionsByIntervenant':
        return this.missionService.findByIntervenant(
          args.intervenantId as number,
        );

      case 'updateMission': {
        const missionUpdateData: Record<string, unknown> = {};
        if (args.titre !== undefined) missionUpdateData.titre = args.titre;
        if (args.date !== undefined)
          missionUpdateData.date = new Date(args.date as string);
        if (args.duree !== undefined) missionUpdateData.duree = args.duree;
        if (args.lieu !== undefined) missionUpdateData.lieu = args.lieu;

        return this.missionService.update(
          args.id as number,
          missionUpdateData as {
            titre?: string;
            date?: Date;
            duree?: number;
            lieu?: string;
          },
        );
      }

      case 'assignMission':
        return this.missionService.assign(args.missionId as number, {
          intervenantId: args.intervenantId as number,
        });

      case 'unassignMission':
        return this.missionService.unassign(args.missionId as number);

      case 'deleteMission':
        await this.missionService.delete(args.id as number);
        return { message: `Mission #${args.id} supprimée avec succès` };

      default:
        throw new Error(`Tool inconnu: ${name}`);
    }
  }
}
