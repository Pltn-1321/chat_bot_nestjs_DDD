import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  HumanMessage,
  BaseMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { IntervenantService } from '../../../intervenant/application/services/intervenant.service';
import { MissionService } from '../../../mission/application/services/mission.service';
import { createChatTools } from './langchain-tools';
import type {
  AIAgent,
  AIAgentResponse,
  ChatHistoryMessage,
} from '../../domain/ports';

/**
 * LangChainAgentAdapter - ADAPTER qui implémente le Port AIAgent
 *
 * Architecture Hexagonale:
 * - Le Port (AIAgent) est défini dans domain/ports/
 * - Cet Adapter implémente le Port en utilisant LangChain + OpenRouter
 * - Le ChatService injecte le PORT, pas cet adapter directement
 *
 * Ce service encapsule un agent LangChain qui utilise OpenRouter
 * pour le LLM et les tools pour interagir avec les services métier.
 *
 * Utilise le pattern "tool calling" de LangChain:
 * 1. Le LLM reçoit le message + tools disponibles
 * 2. Le LLM décide quels tools appeler
 * 3. On exécute les tools et renvoie les résultats au LLM
 * 4. Le LLM génère la réponse finale
 */
@Injectable()
export class LangChainAgentAdapter implements AIAgent, OnModuleInit {
  private readonly logger = new Logger(LangChainAgentAdapter.name);
  private llm: ChatOpenAI;
  private tools: DynamicStructuredTool[];
  private toolsMap: Map<string, DynamicStructuredTool>;

  constructor(
    private readonly configService: ConfigService,
    private readonly intervenantService: IntervenantService,
    private readonly missionService: MissionService,
  ) {}

  /**
   * Initialise l'agent au démarrage du module
   */
  async onModuleInit() {
    this.logger.log("Initialisation de l'agent LangChain...");

    const apiKey = this.configService.getOrThrow<string>('OPENROUTER_API_KEY');
    const model = this.configService.get<string>(
      'OPENROUTER_MODEL',
      'z-ai/glm-4.5-air:free',
    );

    this.logger.debug(`Model: ${model}, API Key: ${apiKey.slice(0, 10)}...`);

    // 1. Créer le modèle LLM (OpenRouter via API OpenAI)
    this.llm = new ChatOpenAI({
      model: model,
      apiKey: apiKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': this.configService.get(
            'APP_URL',
            'http://localhost:3000',
          ),
          'X-Title': 'Gestion Intervenants - Chatbot',
        },
      },
      temperature: 0.7,
    });

    // 2. Créer les tools
    this.tools = createChatTools(this.intervenantService, this.missionService);

    // 3. Créer une map pour accès rapide aux tools par nom
    this.toolsMap = new Map(this.tools.map((tool) => [tool.name, tool]));

    this.logger.log(`${this.tools.length} tools créés`);
    this.logger.log("Agent LangChain initialisé avec succès");
  }

  /**
   * Prompt système pour le chatbot
   */
  private getSystemPrompt(): string {
    return `Tu es un assistant intelligent pour la gestion des intervenants et des missions d'enseignement.

CAPACITÉS:
- Créer, modifier, rechercher et supprimer des intervenants (enseignants/formateurs)
- Créer, modifier, rechercher et supprimer des missions (cours/formations)
- Assigner ou retirer des intervenants des missions
- Consulter les missions à venir ou non assignées

RÈGLES:
1. Utilise TOUJOURS les outils disponibles pour effectuer les actions demandées
2. Réponds TOUJOURS en français
3. Sois concis mais informatif
4. Après une action, confirme ce qui a été fait avec les détails pertinents
5. Si une erreur se produit, explique clairement le problème
6. Pour créer un intervenant, il faut: nom, email, et spécialité (téléphone optionnel)
7. Pour créer une mission, il faut: titre, date (ISO 8601), durée (minutes), et lieu

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Quand l'utilisateur mentionne "demain", "lundi prochain", etc., calcule la date correcte au format ISO 8601.`;
  }

  /**
   * Invoque l'agent avec un message et l'historique de conversation
   *
   * Implémente le Port AIAgent du Domain
   */
  async invoke(
    input: string,
    chatHistory: ChatHistoryMessage[] = [],
  ): Promise<AIAgentResponse> {
    this.logger.debug(`Invocation avec: "${input.slice(0, 50)}..."`);

    const intermediateSteps: Array<{
      tool: string;
      input: Record<string, unknown>;
      output: string;
    }> = [];

    // Construire les messages
    const messages: BaseMessage[] = [
      new SystemMessage(this.getSystemPrompt()),
      // Historique
      ...chatHistory.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
      // Message actuel
      new HumanMessage(input),
    ];

    // Binder les tools au LLM
    const llmWithTools = this.llm.bindTools(this.tools);

    // Boucle d'exécution des tools (max 5 itérations)
    let iteration = 0;
    const maxIterations = 5;

    while (iteration < maxIterations) {
      iteration++;
      this.logger.debug(`Itération ${iteration}/${maxIterations}`);

      // Appeler le LLM
      const response = await llmWithTools.invoke(messages);

      // Si pas de tool calls, on a la réponse finale
      if (
        !response.tool_calls ||
        response.tool_calls.length === 0
      ) {
        this.logger.debug(
          `Réponse finale (${intermediateSteps.length} tools utilisés)`,
        );
        return {
          output:
            typeof response.content === 'string'
              ? response.content
              : JSON.stringify(response.content),
          intermediateSteps:
            intermediateSteps.length > 0 ? intermediateSteps : undefined,
        };
      }

      // Ajouter la réponse de l'assistant aux messages
      messages.push(response);

      // Exécuter chaque tool call
      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.args as Record<string, unknown>;

        this.logger.debug(`Exécution du tool: ${toolName}`);

        const tool = this.toolsMap.get(toolName);
        if (!tool) {
          const errorMsg = `Tool inconnu: ${toolName}`;
          this.logger.warn(errorMsg);
          messages.push(
            new ToolMessage({
              tool_call_id: toolCall.id || toolName,
              content: JSON.stringify({ success: false, error: errorMsg }),
            }),
          );
          continue;
        }

        try {
          // Exécuter le tool
          const result = await tool.invoke(toolArgs);

          // Enregistrer l'étape
          intermediateSteps.push({
            tool: toolName,
            input: toolArgs,
            output: result,
          });

          // Ajouter le résultat aux messages
          messages.push(
            new ToolMessage({
              tool_call_id: toolCall.id || toolName,
              content: result,
            }),
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Erreur inconnue';
          this.logger.error(`Erreur tool ${toolName}: ${errorMsg}`);

          intermediateSteps.push({
            tool: toolName,
            input: toolArgs,
            output: JSON.stringify({ success: false, error: errorMsg }),
          });

          messages.push(
            new ToolMessage({
              tool_call_id: toolCall.id || toolName,
              content: JSON.stringify({ success: false, error: errorMsg }),
            }),
          );
        }
      }
    }

    // Si on atteint le max d'itérations, retourner ce qu'on a
    this.logger.warn(`Max iterations atteint (${maxIterations})`);
    return {
      output:
        "Désolé, je n'ai pas pu terminer l'opération. Veuillez réessayer avec une demande plus simple.",
      intermediateSteps,
    };
  }

  /**
   * Retourne la liste des tools disponibles (pour documentation)
   */
  getAvailableTools(): string[] {
    return this.tools.map((tool) => tool.name);
  }
}
