import { MessageRoleType } from '../value-objects';

/**
 * Représente un message dans l'historique de chat pour l'agent
 */
export interface ChatHistoryMessage {
  role: MessageRoleType;
  content: string;
}

/**
 * Représente un step intermédiaire (tool call) de l'agent
 */
export interface AgentIntermediateStep {
  tool: string;
  input: Record<string, unknown>;
  output: string;
}

/**
 * Réponse de l'agent IA
 */
export interface AIAgentResponse {
  /** La réponse finale de l'agent */
  output: string;
  /** Les étapes intermédiaires (tool calls) */
  intermediateSteps?: AgentIntermediateStep[];
}

/**
 * AIAgent - PORT (Interface)
 *
 * Ce port définit le CONTRAT pour l'interaction avec un agent IA conversationnel.
 * Il fait partie du DOMAIN et ne connaît PAS LangChain, OpenAI, ou autre.
 *
 * L'implémentation concrète (Adapter) sera dans la couche Infrastructure.
 *
 * Avantages:
 * - Le Domain/Application ne dépend pas de la technologie IA
 * - Facile à mocker pour les tests
 * - Permet de changer de provider (LangChain → AutoGen, etc.) sans toucher au Domain
 */
export interface AIAgent {
  /**
   * Invoque l'agent avec un message et un historique de conversation
   *
   * @param message - Le message de l'utilisateur
   * @param history - L'historique de la conversation
   * @returns La réponse de l'agent avec les éventuels tool calls
   */
  invoke(message: string, history: ChatHistoryMessage[]): Promise<AIAgentResponse>;
}

/**
 * Token d'injection pour NestJS
 */
export const AI_AGENT = Symbol('AI_AGENT');
